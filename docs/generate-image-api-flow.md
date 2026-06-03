# Generate 图片生成调用链整理

当前只保留模板图片生成。旧版 Magic Studio、Portrait Generator、`/api/generate/magic/image` 和 `portrait`/`magic` 队列任务类型已移除。

## 1. 总体架构

图片生成链路分为两层服务：

- `apps/bacc`：Next.js 前端和 BFF API。负责登录态校验、拼接前端请求、通过内部签名代理到后端。
- `apps/api`：Express API。负责模板校验、资产鉴权、次数扣减、队列入队和任务状态查询。
- `apps/worker`：独立队列消费进程。负责从 Redis 队列取任务、调用图片模型、上传 R2、更新任务状态。

大模型 API 不在前端或 HTTP API 进程中直接调用，统一由 `apps/worker/src/lib/generators/base-generator.ts` 发起。

## 2. 前端提交

入口文件：

- `apps/bacc/app/components/SlotConfigPanel.tsx`

点击 `Generate` 后，前端会：

1. 检查 PERSON slot 是否已上传。
2. 检查 premium asset 是否可用。
3. 使用模板详情里的 `generationFeatureKey` 检查余额。
4. 组装 `configuredSlots`：
   - PERSON slot：传用户上传图片的 base64 data URL。
   - OOTD / DECORATION slot：传 `assetId`，后端解析资产图片。
5. POST 到 `/api/generate/template`。

请求示例：

```json
{
  "templateId": "...",
  "slots": [
    {
      "refId": "person_1",
      "slotType": "PERSON",
      "imageSource": "data:image/..."
    },
    {
      "refId": "person_1_ootd",
      "slotType": "OOTD",
      "assetId": "..."
    }
  ]
}
```

提交成功后前端拿到 `taskId`，轮询 `/api/queue/status?taskId=...`。完成后用 `result.imageUrl` 展示生成图。

## 3. BFF 代理

入口文件：

- `apps/bacc/app/api/generate/template/route.ts`

职责：

1. 调 `auth()` 校验登录。
2. 从 session 取 `userId`。
3. 校验 `templateId` 和 `slots`。
4. 用 `makeInternalHeaders(userId)` 生成内部签名头。
5. 转发到后端：

```txt
POST {API_BACKEND_URL}/api/templates/:templateId/generate
```

这层不扣次数、不调用模型、不上传图片。

## 4. 后端模板生成接口

入口文件：

- `apps/api/src/routes/templates.ts`

接口：

```txt
POST /api/templates/:id/generate
```

主要流程：

1. 校验内部签名或 session token，得到 `userId`。
2. 校验 `slots`。
3. 读取模板、模板 slots 和 descriptor。
4. 校验 PERSON 必填 slot。
5. 查询并校验 selected assets。
6. 校验 premium asset 权限。
7. 归一化 slots 为 `{ refId, slotType, imageSource, assetPayload }`。
8. 校验 `imageSource` 必须是 `data:image/`、`http://` 或 `https://`。
9. 从模板配置读取 `generationFeatureKey`、`promptPolicyKey` 和 `promptPolicyVersion`。
10. 原子扣减 `generationFeatureKey` 对应次数。
11. 构建 template 队列 payload。
12. 入 Redis 队列。
13. 设置用户当前任务。
14. 写入 `usageLog`。
15. 返回 `taskId`。

队列 payload：

```ts
{
  templateId,
  templateName,
  templateImageUrl,
  descriptor,
  slots,
  generationConfig, // 只包含本次任务的 prompt policy 快照
  _deductedFeatureKey
}
```

如果扣费后入队失败，会调用 `refundDeductedCount` 退还次数。Worker 永久失败时也会根据 `_deductedFeatureKey` 退款。

## 5. 队列处理

相关文件：

- `packages/queue/src/task-manager.ts`
- `apps/worker/src/lib/queue/worker.ts`
- `apps/api/src/routes/queue.ts`
- `packages/queue/src/types.ts`

当前队列任务类型只有：

```ts
type TaskType = 'template';
```

`TaskManager.submitTask` 会：

1. 生成 `taskId`。
2. 将任务详情写入 Redis hash：`task:{taskId}`。
3. 设置任务 TTL。
4. 把任务 id 加到用户任务集合。
5. 把任务 id 推入 `queue:pending`。

API 进程不消费队列。队列消费需要单独启动 worker：

```bash
npm run dev:worker
```

worker 从 `apps/worker/.env` 读取运行配置。可从 `apps/worker/.env.example` 创建本地配置文件；不要让 worker 读取 `apps/api/.env` 或 `apps/api/wrangler.jsonc`。

生产环境启动入口：

```bash
npm run start:worker
```

`QueueWorker.processNext` 会：

1. 从 `queue:pending` 移动一个任务到 `queue:processing:list`。
2. 将任务状态更新为 `processing`。
3. 使用 `TemplateGenerator` 执行生成。
4. 成功后写入 `result`，状态更新为 `completed`。
5. 失败时按 `maxRetries` 重试；重试耗尽后标记 `failed`，并退款。

## 6. TemplateGenerator

入口文件：

- `apps/worker/src/lib/generators/template-generator.ts`

`TemplateGenerator.generate` 的职责：

1. 校验 `descriptor` 和 `slots`。
2. 构建图片输入列表 `imageParts`：
   - 第 1 张：模板原图 `templateImageUrl`，必须存在且加载成功。
   - 第 2 张起：slot 图片，按 `slots` 顺序。
3. 每张图通过 `getBase64FromSource` 转 base64：
   - 支持 data URL。
   - 支持 http/https URL。
4. 每张图通过 `prepareImageForModel` 压缩：
   - 最大边默认 `1536`，由 `TEMPLATE_INPUT_IMAGE_MAX_DIMENSION` 控制。
   - 输出 JPEG，质量默认 `82`，由 `TEMPLATE_INPUT_IMAGE_JPEG_QUALITY` 控制。
5. 调 `buildPromptFromDescriptor` 生成中文 prompt。
6. 从环境变量读取模型列表：

```txt
NANO_BANANA_TEMPLATE_MODELS
```

7. 使用任务 payload 中的 prompt policy 快照生成 prompt；`baseUrl`、超时、图片预处理等技术运行参数由服务环境变量或代码默认值控制，不进 Admin。
8. 调 `BaseGenerator.callGeminiAPI`。
9. 将返回的 base64 图片上传 R2。
10. 返回 `imageUrl`、`thumbnailUrl`、`fileId`。

## 7. Prompt 约定

`buildPromptFromDescriptor` 依赖图片顺序：

- 第 1 张图固定是模板图；当前流程不支持无模板图生成。
- slot 图片从第 2 张开始。
- prompt 会把完整模板 descriptor 注入 `{{templateJson}}`。
- prompt 会把用户配置的 slots 和对应图片序号注入 `{{slotsJson}}`。
- 如果存在对应 slot 类型，会分别注入 `{{personSlotsJson}}`、`{{ootdSlotsJson}}`、`{{decorationSlotsJson}}`。

代码不再从 descriptor 中抽取 `theme`、`subjectId`、`propId` 等字段级变量。descriptor 的 key 由 PromptPolicy 自己决定如何解释，避免代码和模板 JSON key 强绑定。

PromptPolicy 支持的占位：

- `{{templateJson}}`：完整模板 descriptor JSON。
- `{{slotsJson}}`：全部槽位和图片序号。
- `{{personSlotsJson}}`：PERSON 槽位和图片序号。
- `{{ootdSlotsJson}}`：OOTD 槽位和图片序号。
- `{{decorationSlotsJson}}`：DECORATION 槽位和图片序号。

Prompt Policy 按目的分组配置最终 prompt 中出现的文案片段：

- 模板上下文：`templateContextInstruction`。
- 槽位上下文：`slotContextInstruction`。
- PERSON：`personInstruction`。
- OOTD：`ootdInstruction`。
- DECORATION：`decorationInstruction`。
- 最终检查：`finalCheckInstruction`。

没有配置的文案片段不会输出。没有对应 slot 类型时，该类型的 prompt 片段不会输出；不再生成未匹配兜底替换说明。

Admin 预览：

- 提示词策略弹窗提供“配置预览”，用示例模板 JSON 和示例 slots 渲染。
- 模板管理弹窗提供“完整 Prompt 预览”，用当前模板 descriptor、当前 slots 和选中的 PromptPolicy 渲染。

## 8. 大模型 API 调用

入口文件：

- `apps/worker/src/lib/generators/base-generator.ts`

必填环境变量：

```txt
NANO_BANANA_API_KEY
```

可选环境变量：

```txt
NANO_BANANA_BASE_URL
```

默认 base URL：

```txt
https://generativelanguage.googleapis.com/v1beta
```

调用流程：

1. 对模型列表逐个 fallback。
2. 拼 endpoint：`{baseUrl}/models/{modelId}:generateContent`，其中 `baseUrl` 来自 `NANO_BANANA_BASE_URL` 或默认值。
3. 通过 `payloadFn(modelId)` 生成请求体。
4. 打印 payload 大小和图片摘要。
5. 用 axios POST。
6. HTTP 2xx 时从响应里提取 `inline_data` 或 `inlineData`。
7. 当前模型没返回图片或失败时尝试下一个模型。
8. 所有模型失败后抛错。

当前请求头：

```txt
Authorization: Bearer {NANO_BANANA_API_KEY}
```

图片响应解析路径：

```ts
data.candidates[].content.parts[].inline_data
data.candidates[].content.parts[].inlineData
data.candidates[].parts[].inline_data
data.candidates[].parts[].inlineData
```

## 9. 结果上传和历史

模板生成成功后，`TemplateGenerator` 调 `apps/worker/src/lib/storage.ts` 上传 R2。

上传参数包含：

```ts
{
  appId: 'bacc',
  tags: ['template', 'generated'],
  metadata: { templateId, templateName },
  createdBy: userId,
  userId,
  generationType: 'template',
  promptData: { templateId, templateName, slots },
  templateId
}
```

上传成功后，worker 将 `imageUrl` 写入队列任务 `result`。

前端通过轮询拿到 `result.imageUrl` 并显示生成图。

历史记录接口仍可能展示旧数据，但新的生成任务只会产生 `generationType = 'template'`：

- `GET /api/history`
- `GET /api/templates/:id/last-result`

## 10. 无状态生成配置

生成服务实例只执行配置，不持有业务生成状态。业务可配置项从数据库读取：

- `Template.generationFeatureKey`
- `Template.promptPolicyKey`
- `Template.promptPolicyVersion`
- `PromptPolicy`

请求不再携带 `featureKey`。扣费 feature 和 prompt 策略由模板配置决定。

技术运行配置不进普通 Admin：

- 模型列表：`NANO_BANANA_TEMPLATE_MODELS`
- API base URL：`NANO_BANANA_BASE_URL`
- 图片最大边：`TEMPLATE_INPUT_IMAGE_MAX_DIMENSION`
- JPEG 质量：`TEMPLATE_INPUT_IMAGE_JPEG_QUALITY`
- API key、R2、Redis、内部签名密钥：env/secrets

配置更新与下发：

- Admin 更新 prompt policy 后写入数据库，不需要重启 API。
- 用户发起生成时，API 读取模板当前绑定的 prompt policy，并把解析出的 prompt policy 放入队列 payload。
- Worker 只使用队列 payload 的快照；所以已经入队的任务不会被后续 Admin 更新影响。
- 新发起的任务会使用最新模板绑定和最新 active prompt policy。这个行为兼顾热更新和任务可复现性。

Admin 配置入口：

- 模板管理：模板图上传到 Cloudflare R2、descriptor、slots、slot 绑定素材、扣费 FeatureKey、Prompt Policy。
- 素材管理：OOTD / DECORATION 素材图、素材 payload、premium feature。
- 提示词策略管理：Prompt Policy，并提供配置预览。

仍保留在环境变量里的内容只应是 secret 或基础设施配置：

- `NANO_BANANA_API_KEY`
- R2 credentials
- Redis credentials
- internal/admin auth secret

## 11. 快速定位表

| 环节 | 文件 |
| --- | --- |
| 前端点击 Generate | `apps/bacc/app/components/SlotConfigPanel.tsx` |
| 模板生成 BFF | `apps/bacc/app/api/generate/template/route.ts` |
| 模板生成 Express 接口 | `apps/api/src/routes/templates.ts` |
| 生成配置 Admin API | `apps/admin/src/routes/admin/generation-config.ts` |
| 队列接口 | `apps/api/src/routes/queue.ts` |
| Redis 任务管理 | `packages/queue/src/task-manager.ts` |
| Worker 消费 | `apps/worker/src/lib/queue/worker.ts` |
| 模板 prompt 和图片准备 | `apps/worker/src/lib/generators/template-generator.ts` |
| 大模型 API 统一调用 | `apps/worker/src/lib/generators/base-generator.ts` |
| R2 上传封装 | `apps/worker/src/lib/storage.ts` |

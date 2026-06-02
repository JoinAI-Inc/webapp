-- Generation configuration for stateless image generation services.

ALTER TABLE "templates"
  ADD COLUMN "generation_feature_key" TEXT,
  ADD COLUMN "model_preset_key" TEXT DEFAULT 'template-default',
  ADD COLUMN "prompt_policy_key" TEXT DEFAULT 'template-default',
  ADD COLUMN "prompt_policy_version" INTEGER DEFAULT 1,
  ADD COLUMN "preprocess_preset_key" TEXT DEFAULT 'template-default',
  ADD COLUMN "generation_config" JSONB;

CREATE INDEX "templates_generation_feature_key_idx" ON "templates"("generation_feature_key");
CREATE INDEX "templates_model_preset_key_idx" ON "templates"("model_preset_key");
CREATE INDEX "templates_prompt_policy_key_prompt_policy_version_idx" ON "templates"("prompt_policy_key", "prompt_policy_version");

CREATE TABLE "generation_providers" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "base_url" TEXT NOT NULL,
  "auth_type" TEXT NOT NULL DEFAULT 'bearer',
  "status" TEXT NOT NULL DEFAULT 'active',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "generation_providers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "generation_providers_key_key" ON "generation_providers"("key");
CREATE INDEX "generation_providers_status_idx" ON "generation_providers"("status");

CREATE TABLE "generation_model_presets" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "provider_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "model_ids" JSONB NOT NULL,
  "request_config" JSONB,
  "status" TEXT NOT NULL DEFAULT 'active',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "generation_model_presets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "generation_model_presets_key_key" ON "generation_model_presets"("key");
CREATE INDEX "generation_model_presets_provider_id_idx" ON "generation_model_presets"("provider_id");
CREATE INDEX "generation_model_presets_status_idx" ON "generation_model_presets"("status");

ALTER TABLE "generation_model_presets"
  ADD CONSTRAINT "generation_model_presets_provider_id_fkey"
  FOREIGN KEY ("provider_id") REFERENCES "generation_providers"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "prompt_policies" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "config" JSONB NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "prompt_policies_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "prompt_policies_key_version_key" ON "prompt_policies"("key", "version");
CREATE INDEX "prompt_policies_key_status_version_idx" ON "prompt_policies"("key", "status", "version");

CREATE TABLE "image_preprocess_presets" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "config" JSONB NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "image_preprocess_presets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "image_preprocess_presets_key_key" ON "image_preprocess_presets"("key");
CREATE INDEX "image_preprocess_presets_status_idx" ON "image_preprocess_presets"("status");

INSERT INTO "generation_providers" (
  "id", "key", "name", "base_url", "auth_type", "status", "updated_at"
) VALUES (
  'generation-provider-template-default',
  'nano-banana-default',
  'Nano Banana Default',
  'https://generativelanguage.googleapis.com/v1beta',
  'bearer',
  'active',
  CURRENT_TIMESTAMP
) ON CONFLICT ("key") DO NOTHING;

INSERT INTO "generation_model_presets" (
  "id", "key", "provider_id", "name", "model_ids", "request_config", "status", "updated_at"
) VALUES (
  'generation-model-template-default',
  'template-default',
  'generation-provider-template-default',
  'Default template image model',
  '["gemini-3-pro-image-preview-2k"]'::jsonb,
  '{"responseModalities":["IMAGE"],"timeoutMs":1200000}'::jsonb,
  'active',
  CURRENT_TIMESTAMP
) ON CONFLICT ("key") DO NOTHING;

INSERT INTO "prompt_policies" (
  "id", "key", "version", "name", "config", "status", "updated_at"
) VALUES (
  'prompt-policy-template-default-v1',
  'template-default',
  1,
  'Default template prompt policy',
  '{
    "introTemplateImage": "请以第1张图\"{{imageName}}\"为模板原图进行精准合成，保留原图的整体构图、场景布局、光影、色彩风格和氛围。",
    "introNoTemplateImage": "请根据以下描述进行图像合成，模板主题：{{theme}}。",
    "multiSlotInstruction": "本次是多槽位合成任务，必须同时完成以下所有替换，不能只替换人物或只完成其中一部分：",
    "templateImageInstruction": "第1张模板图只提供构图、姿势、场景、光影和目标元素位置；上面列出的 PERSON/OOTD/DECORATION 槽位都必须覆盖模板中的对应元素。",
    "ootdGlobalInstruction": "特别注意：OOTD 穿搭替换必须按 subject_id 一一对应，只能发生在第1张模板图中对应人物原本衣服覆盖的区域内，不能把参考穿搭作为新增物体贴到背景、空白区域、其他人物身上或人物轮廓外。",
    "multiSubjectOotdInstruction": "如果画面中有多个人物，每个人物的 OOTD 只能应用到自己对应 subject_id 的身体/衣服区域，不能应用到其他人物，也不能跨人物混用。",
    "finalCheck": "最终检查：人物、穿搭、道具/装饰三个类型的已提供槽位都必须在最终图中可见且已替换完成；每个 OOTD 必须只作用于其对应 subject_id 的原服装区域，不得串到其他人物，不得超出该人物原服装区域，不得覆盖背景或非人物区域。最终输出应为高质量、无缝合成的完整图像，不要出现明显的接缝或光影不一致。"
  }'::jsonb,
  'active',
  CURRENT_TIMESTAMP
) ON CONFLICT ("key", "version") DO NOTHING;

INSERT INTO "image_preprocess_presets" (
  "id", "key", "name", "config", "status", "updated_at"
) VALUES (
  'image-preprocess-template-default',
  'template-default',
  'Default 1536px JPEG preprocess',
  '{"maxDimension":1536,"jpegQuality":82,"outputFormat":"jpeg"}'::jsonb,
  'active',
  CURRENT_TIMESTAMP
) ON CONFLICT ("key") DO NOTHING;

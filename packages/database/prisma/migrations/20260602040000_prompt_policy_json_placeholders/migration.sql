-- Prompt policies use whole JSON placeholders instead of descriptor field variables.

UPDATE "prompt_policies"
SET
  "config" = '{
    "templateContextInstruction": "请以第1张图为模板原图进行精准合成。模板 JSON 如下：\n{{templateJson}}",
    "slotContextInstruction": "用户提供的替换槽位和参考图顺序如下。每个 imageNo 对应输入图片序号：\n{{slotsJson}}",
    "personInstruction": "请处理 PERSON 人物替换。只处理以下 PERSON slots；如果没有对应目标，不要自行新增替换：\n{{personSlotsJson}}",
    "ootdInstruction": "请处理 OOTD 穿搭替换。只处理以下 OOTD slots；穿搭只能作用于模板中对应人物的原服装区域，不要串到其他人物或背景：\n{{ootdSlotsJson}}",
    "decorationInstruction": "请处理 DECORATION 装饰/道具替换。只处理以下 DECORATION slots；保持模板中的位置、比例、透视和光影合理：\n{{decorationSlotsJson}}",
    "finalCheckInstruction": "最终检查：只替换 slotsJson 中声明的槽位；没有出现在 slotsJson 中的内容保持模板原样。最终输出应为高质量、无缝合成的完整图像，不要出现明显接缝、错位或光影不一致。"
  }'::jsonb,
  "updated_at" = CURRENT_TIMESTAMP
WHERE "key" = 'template-default' AND "version" = 1;

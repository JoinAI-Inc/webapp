-- Simplify the default template prompt policy to business-editable sections.

UPDATE "prompt_policies"
SET
  "config" = '{
    "templateInstruction": "请以第1张图\"{{imageName}}\"为模板原图进行精准合成，保留原图的构图、姿势、场景布局、光影、色彩风格和氛围。第1张图只作为模板，不作为待保留的人物、服装或装饰素材。",
    "slotInstruction": "本次是多槽位模板替换任务。必须按槽位类型分别处理 PERSON 人物替换、OOTD 穿搭替换、DECORATION 装饰/道具替换；每个已提供槽位都必须完成，不能只完成其中一类。",
    "personReplaceInstruction": "将第1张图中 subject_id=\"{{subjectId}}\"（{{label}}）的人物外貌替换为第{{refNo}}张参考图中的人物。保持第1张图中该人物的动作姿势、表情、肢体方向、身体比例和遮挡关系，仅替换面貌/肤色。",
    "ootdReplaceInstruction": "必须将第1张图中 subject_id=\"{{subjectId}}\"（{{label}}）身上的原服装替换为第{{refNo}}张参考图中的穿搭款式。替换范围严格限制在该人物原服装区域内，不得影响其他人物、背景或身体轮廓。",
    "decorationReplaceInstruction": "必须将第1张图中的\"{{propLabel}}\"替换为第{{refNo}}张参考图中的素材外观。保持目标位置{{posNote}}、数量、持握关系、透视、光影和比例合理。",
    "finalCheckInstruction": "最终检查：已提供的 PERSON、OOTD、DECORATION 槽位都必须在最终图中可见且替换完成；每个 OOTD 只能作用于对应人物的原服装区域，不得串到其他人物，不得覆盖背景或非人物区域。最终输出应为高质量、无缝合成的完整图像，不要出现明显接缝、错位或光影不一致。"
  }'::jsonb,
  "updated_at" = CURRENT_TIMESTAMP
WHERE "key" = 'template-default' AND "version" = 1;

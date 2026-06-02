-- Keep only business-level generation configuration in Admin.
-- Model/provider and image preprocessing are service runtime settings.

DROP TABLE IF EXISTS "image_preprocess_presets";
DROP TABLE IF EXISTS "generation_model_presets";
DROP TABLE IF EXISTS "generation_providers";

DROP INDEX IF EXISTS "templates_model_preset_key_idx";

ALTER TABLE "templates"
  DROP COLUMN IF EXISTS "model_preset_key",
  DROP COLUMN IF EXISTS "preprocess_preset_key",
  DROP COLUMN IF EXISTS "generation_config";

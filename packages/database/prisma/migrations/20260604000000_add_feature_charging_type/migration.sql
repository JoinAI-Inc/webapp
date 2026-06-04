DO $$
BEGIN
  CREATE TYPE "FeatureChargingType" AS ENUM ('COUNT', 'TOGGLE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "features"
  ADD COLUMN IF NOT EXISTS "charging_type" "FeatureChargingType" NOT NULL DEFAULT 'COUNT';

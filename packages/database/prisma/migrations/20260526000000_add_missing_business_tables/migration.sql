-- Backfill business tables that existed in schema.prisma but were missing from
-- the migration chain used by fresh deployments.

CREATE TYPE "TemplateStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "SlotType" AS ENUM ('OOTD', 'DECORATION', 'PERSON');
CREATE TYPE "AssetType" AS ENUM ('OOTD', 'DECORATION');

CREATE TABLE "pricing_plan_features" (
  "id" BIGSERIAL NOT NULL,
  "pricing_plan_id" BIGINT NOT NULL,
  "feature_id" BIGINT NOT NULL,
  "usage_count" INTEGER,
  CONSTRAINT "pricing_plan_features_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "pricing_plan_features_pricing_plan_id_feature_id_key"
  ON "pricing_plan_features"("pricing_plan_id", "feature_id");

ALTER TABLE "pricing_plan_features"
  ADD CONSTRAINT "pricing_plan_features_pricing_plan_id_fkey"
  FOREIGN KEY ("pricing_plan_id") REFERENCES "pricing_plans"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "pricing_plan_features"
  ADD CONSTRAINT "pricing_plan_features_feature_id_fkey"
  FOREIGN KEY ("feature_id") REFERENCES "features"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "user_feature_unlocks" (
  "id" BIGSERIAL NOT NULL,
  "user_id" TEXT NOT NULL,
  "feature_id" BIGINT NOT NULL,
  "order_id" BIGINT NOT NULL,
  "unlocked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expire_at" TIMESTAMP(3),
  CONSTRAINT "user_feature_unlocks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_feature_unlocks_user_id_feature_id_key"
  ON "user_feature_unlocks"("user_id", "feature_id");
CREATE INDEX "user_feature_unlocks_user_id_feature_id_idx"
  ON "user_feature_unlocks"("user_id", "feature_id");

ALTER TABLE "user_feature_unlocks"
  ADD CONSTRAINT "user_feature_unlocks_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "user_feature_unlocks"
  ADD CONSTRAINT "user_feature_unlocks_feature_id_fkey"
  FOREIGN KEY ("feature_id") REFERENCES "features"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "user_feature_unlocks"
  ADD CONSTRAINT "user_feature_unlocks_order_id_fkey"
  FOREIGN KEY ("order_id") REFERENCES "orders"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "templates" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "status" "TemplateStatus" NOT NULL DEFAULT 'DRAFT',
  "image_id" TEXT,
  "image_url" TEXT NOT NULL,
  "descriptor" JSONB NOT NULL,
  "resolution" TEXT,
  "theme" TEXT,
  "favorite_count" INTEGER NOT NULL DEFAULT 0,
  "created_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "templates_status_idx" ON "templates"("status");
CREATE INDEX "templates_created_at_idx" ON "templates"("created_at");

CREATE TABLE "tags" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

CREATE TABLE "template_tags" (
  "template_id" TEXT NOT NULL,
  "tag_id" TEXT NOT NULL,
  CONSTRAINT "template_tags_pkey" PRIMARY KEY ("template_id", "tag_id")
);

ALTER TABLE "template_tags"
  ADD CONSTRAINT "template_tags_template_id_fkey"
  FOREIGN KEY ("template_id") REFERENCES "templates"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "template_tags"
  ADD CONSTRAINT "template_tags_tag_id_fkey"
  FOREIGN KEY ("tag_id") REFERENCES "tags"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "template_favorites" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "template_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "template_favorites_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "template_favorites_user_id_template_id_key"
  ON "template_favorites"("user_id", "template_id");
CREATE INDEX "template_favorites_user_id_idx" ON "template_favorites"("user_id");

ALTER TABLE "template_favorites"
  ADD CONSTRAINT "template_favorites_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "template_favorites"
  ADD CONSTRAINT "template_favorites_template_id_fkey"
  FOREIGN KEY ("template_id") REFERENCES "templates"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "template_slots" (
  "id" TEXT NOT NULL,
  "template_id" TEXT NOT NULL,
  "slot_type" "SlotType" NOT NULL,
  "ref_id" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "description" TEXT,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "template_slots_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "template_slots_template_id_idx" ON "template_slots"("template_id");

ALTER TABLE "template_slots"
  ADD CONSTRAINT "template_slots_template_id_fkey"
  FOREIGN KEY ("template_id") REFERENCES "templates"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "assets" (
  "id" TEXT NOT NULL,
  "app_id" BIGINT,
  "asset_type" "AssetType" NOT NULL,
  "name" TEXT NOT NULL,
  "thumbnail_url" TEXT NOT NULL,
  "payload" JSONB,
  "required_feature_key" TEXT,
  "status" TEXT NOT NULL DEFAULT 'active',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "assets_asset_type_idx" ON "assets"("asset_type");
CREATE INDEX "assets_required_feature_key_idx" ON "assets"("required_feature_key");

CREATE TABLE "template_slot_assets" (
  "slot_id" TEXT NOT NULL,
  "asset_id" TEXT NOT NULL,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "template_slot_assets_pkey" PRIMARY KEY ("slot_id", "asset_id")
);

ALTER TABLE "template_slot_assets"
  ADD CONSTRAINT "template_slot_assets_slot_id_fkey"
  FOREIGN KEY ("slot_id") REFERENCES "template_slots"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "template_slot_assets"
  ADD CONSTRAINT "template_slot_assets_asset_id_fkey"
  FOREIGN KEY ("asset_id") REFERENCES "assets"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

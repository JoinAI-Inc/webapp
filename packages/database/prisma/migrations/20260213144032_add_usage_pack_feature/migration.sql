-- AlterEnum
ALTER TYPE "PlanType" ADD VALUE 'USAGE_PACK';

-- CreateTable
CREATE TABLE "features" (
    "id" BIGSERIAL NOT NULL,
    "feature_key" TEXT NOT NULL,
    "app_id" BIGINT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_packs" (
    "id" BIGSERIAL NOT NULL,
    "pricing_plan_id" BIGINT NOT NULL,
    "feature_id" BIGINT NOT NULL,
    "usage_count" INTEGER NOT NULL,

    CONSTRAINT "usage_packs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_feature_balances" (
    "id" BIGSERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "feature_id" BIGINT NOT NULL,
    "remaining_count" INTEGER NOT NULL,
    "total_purchased" INTEGER NOT NULL DEFAULT 0,
    "total_used" INTEGER NOT NULL DEFAULT 0,
    "last_used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_feature_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_logs" (
    "id" BIGSERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "feature_id" BIGINT NOT NULL,
    "source_type" TEXT NOT NULL,
    "order_id" BIGINT,
    "used_count" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "features_feature_key_key" ON "features"("feature_key");

-- CreateIndex
CREATE INDEX "features_app_id_idx" ON "features"("app_id");

-- CreateIndex
CREATE INDEX "features_feature_key_idx" ON "features"("feature_key");

-- CreateIndex
CREATE UNIQUE INDEX "usage_packs_pricing_plan_id_feature_id_key" ON "usage_packs"("pricing_plan_id", "feature_id");

-- CreateIndex
CREATE INDEX "user_feature_balances_user_id_feature_id_remaining_count_idx" ON "user_feature_balances"("user_id", "feature_id", "remaining_count");

-- CreateIndex
CREATE UNIQUE INDEX "user_feature_balances_user_id_feature_id_key" ON "user_feature_balances"("user_id", "feature_id");

-- CreateIndex
CREATE INDEX "usage_logs_user_id_feature_id_created_at_idx" ON "usage_logs"("user_id", "feature_id", "created_at");

-- AddForeignKey
ALTER TABLE "features" ADD CONSTRAINT "features_app_id_fkey" FOREIGN KEY ("app_id") REFERENCES "apps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_packs" ADD CONSTRAINT "usage_packs_pricing_plan_id_fkey" FOREIGN KEY ("pricing_plan_id") REFERENCES "pricing_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_packs" ADD CONSTRAINT "usage_packs_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "features"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_feature_balances" ADD CONSTRAINT "user_feature_balances_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_feature_balances" ADD CONSTRAINT "user_feature_balances_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "features"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_logs" ADD CONSTRAINT "usage_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_logs" ADD CONSTRAINT "usage_logs_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "features"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_logs" ADD CONSTRAINT "usage_logs_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

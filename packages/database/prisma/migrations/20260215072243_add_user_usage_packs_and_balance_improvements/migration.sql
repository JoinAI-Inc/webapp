-- AlterTable
ALTER TABLE "usage_logs" ADD COLUMN     "balance_after" INTEGER,
ADD COLUMN     "balance_before" INTEGER,
ADD COLUMN     "usage_pack_id" BIGINT;

-- CreateTable
CREATE TABLE "user_usage_packs" (
    "id" BIGSERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "order_id" BIGINT NOT NULL,
    "feature_id" BIGINT NOT NULL,
    "total_count" INTEGER NOT NULL,
    "remaining_count" INTEGER NOT NULL,
    "purchased_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_usage_packs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_usage_packs_user_id_feature_id_expires_at_idx" ON "user_usage_packs"("user_id", "feature_id", "expires_at");

-- CreateIndex
CREATE INDEX "user_usage_packs_user_id_feature_id_remaining_count_idx" ON "user_usage_packs"("user_id", "feature_id", "remaining_count");

-- CreateIndex
CREATE UNIQUE INDEX "user_usage_packs_order_id_feature_id_key" ON "user_usage_packs"("order_id", "feature_id");

-- AddForeignKey
ALTER TABLE "usage_logs" ADD CONSTRAINT "usage_logs_usage_pack_id_fkey" FOREIGN KEY ("usage_pack_id") REFERENCES "user_usage_packs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_usage_packs" ADD CONSTRAINT "user_usage_packs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_usage_packs" ADD CONSTRAINT "user_usage_packs_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_usage_packs" ADD CONSTRAINT "user_usage_packs_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "features"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

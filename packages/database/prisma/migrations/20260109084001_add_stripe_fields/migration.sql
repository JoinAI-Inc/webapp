-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "stripe_invoice_id" TEXT,
ADD COLUMN     "stripe_metadata" JSONB,
ADD COLUMN     "stripe_subscription_id" TEXT;

-- AlterTable
ALTER TABLE "pricing_plans" ADD COLUMN     "stripe_metadata" JSONB,
ADD COLUMN     "stripe_price_id_monthly" TEXT,
ADD COLUMN     "stripe_price_id_quarterly" TEXT,
ADD COLUMN     "stripe_price_id_yearly" TEXT;

-- CreateIndex
CREATE INDEX "orders_stripe_session_id_idx" ON "orders"("stripe_session_id");

-- CreateIndex
CREATE INDEX "orders_stripe_subscription_id_idx" ON "orders"("stripe_subscription_id");

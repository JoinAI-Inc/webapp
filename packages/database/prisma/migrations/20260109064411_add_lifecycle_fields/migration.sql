-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'LOCKED');

-- CreateEnum
CREATE TYPE "AppStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'UNLISTED', 'DISABLED', 'SUNSET', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('ACTIVE', 'RETIRED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('SUBSCRIPTION', 'ONE_TIME');

-- CreateEnum
CREATE TYPE "ScopeType" AS ENUM ('GLOBAL', 'SPECIFIC_APP');

-- CreateEnum
CREATE TYPE "BillingInterval" AS ENUM ('MONTH', 'QUARTER', 'YEAR');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "EntitlementType" AS ENUM ('SUBSCRIPTION', 'PERMANENT');

-- CreateEnum
CREATE TYPE "EntitlementStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED');

-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "full_name" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "stripe_customer_id" TEXT,
    "total_spend_amount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "total_order_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "apps" (
    "id" BIGSERIAL NOT NULL,
    "app_key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "access_url" TEXT NOT NULL,
    "status" "AppStatus" NOT NULL DEFAULT 'DRAFT',
    "purchasable" BOOLEAN NOT NULL DEFAULT true,
    "allow_in_new_plan" BOOLEAN NOT NULL DEFAULT true,
    "sunset_at" TIMESTAMP(3),
    "archived_at" TIMESTAMP(3),
    "archived_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "apps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_plans" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "plan_type" "PlanType" NOT NULL,
    "scope_type" "ScopeType" NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "billing_interval" "BillingInterval",
    "stripe_product_id" TEXT,
    "stripe_price_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "status" "PlanStatus" NOT NULL DEFAULT 'ACTIVE',
    "sellable" BOOLEAN NOT NULL DEFAULT true,
    "retired_at" TIMESTAMP(3),
    "archived_at" TIMESTAMP(3),
    "archived_reason" TEXT,
    "replacement_plan_id" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pricing_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_plan_apps" (
    "id" BIGSERIAL NOT NULL,
    "pricing_plan_id" BIGINT NOT NULL,
    "app_id" BIGINT NOT NULL,

    CONSTRAINT "pricing_plan_apps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" BIGSERIAL NOT NULL,
    "order_no" TEXT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "pricing_plan_id" BIGINT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "stripe_session_id" TEXT,
    "stripe_payment_intent_id" TEXT,
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_entitlements" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "source_order_id" BIGINT,
    "entitlement_type" "EntitlementType" NOT NULL,
    "scope_type" "ScopeType" NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expire_time" TIMESTAMP(3),
    "status" "EntitlementStatus" NOT NULL DEFAULT 'ACTIVE',
    "stripe_subscription_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_entitlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_entitlement_apps" (
    "id" BIGSERIAL NOT NULL,
    "entitlement_id" BIGINT NOT NULL,
    "app_id" BIGINT NOT NULL,

    CONSTRAINT "user_entitlement_apps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_social_binds" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_sub" TEXT NOT NULL,
    "social_email" TEXT,
    "social_name" TEXT,
    "social_avatar" TEXT,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "token_expires_at" TIMESTAMP(3),
    "raw_data" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_social_binds_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "apps_app_key_key" ON "apps"("app_key");

-- CreateIndex
CREATE UNIQUE INDEX "pricing_plan_apps_pricing_plan_id_app_id_key" ON "pricing_plan_apps"("pricing_plan_id", "app_id");

-- CreateIndex
CREATE UNIQUE INDEX "orders_order_no_key" ON "orders"("order_no");

-- CreateIndex
CREATE INDEX "user_entitlements_user_id_status_expire_time_idx" ON "user_entitlements"("user_id", "status", "expire_time");

-- CreateIndex
CREATE UNIQUE INDEX "user_entitlement_apps_entitlement_id_app_id_key" ON "user_entitlement_apps"("entitlement_id", "app_id");

-- CreateIndex
CREATE INDEX "user_social_binds_user_id_idx" ON "user_social_binds"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_social_binds_provider_provider_sub_key" ON "user_social_binds"("provider", "provider_sub");

-- AddForeignKey
ALTER TABLE "pricing_plan_apps" ADD CONSTRAINT "pricing_plan_apps_pricing_plan_id_fkey" FOREIGN KEY ("pricing_plan_id") REFERENCES "pricing_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_plan_apps" ADD CONSTRAINT "pricing_plan_apps_app_id_fkey" FOREIGN KEY ("app_id") REFERENCES "apps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_pricing_plan_id_fkey" FOREIGN KEY ("pricing_plan_id") REFERENCES "pricing_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_entitlements" ADD CONSTRAINT "user_entitlements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_entitlements" ADD CONSTRAINT "user_entitlements_source_order_id_fkey" FOREIGN KEY ("source_order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_entitlement_apps" ADD CONSTRAINT "user_entitlement_apps_entitlement_id_fkey" FOREIGN KEY ("entitlement_id") REFERENCES "user_entitlements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_entitlement_apps" ADD CONSTRAINT "user_entitlement_apps_app_id_fkey" FOREIGN KEY ("app_id") REFERENCES "apps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_social_binds" ADD CONSTRAINT "user_social_binds_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

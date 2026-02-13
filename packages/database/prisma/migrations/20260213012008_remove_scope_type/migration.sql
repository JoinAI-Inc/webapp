/*
  Warnings:

  - You are about to drop the column `scope_type` on the `pricing_plans` table. All the data in the column will be lost.
  - You are about to drop the column `scope_type` on the `user_entitlements` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "pricing_plans" DROP COLUMN "scope_type";

-- AlterTable
ALTER TABLE "user_entitlements" DROP COLUMN "scope_type";

-- DropEnum
DROP TYPE "ScopeType";

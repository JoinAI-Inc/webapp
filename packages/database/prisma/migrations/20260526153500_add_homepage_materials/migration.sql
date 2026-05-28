CREATE TABLE "site_themes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "config" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_themes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "site_themes_status_updated_at_idx" ON "site_themes"("status", "updated_at");

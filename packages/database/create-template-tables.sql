-- 仅创建模板系统新增的表（enum 已存在）

CREATE TABLE IF NOT EXISTS "templates" (
  "id"             TEXT NOT NULL,
  "name"           TEXT NOT NULL,
  "status"         "TemplateStatus" NOT NULL DEFAULT 'DRAFT',
  "image_id"       TEXT,
  "image_url"      TEXT NOT NULL,
  "descriptor"     JSONB NOT NULL,
  "resolution"     TEXT,
  "theme"          TEXT,
  "favorite_count" INTEGER NOT NULL DEFAULT 0,
  "created_by"     TEXT,
  "created_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "templates_status_idx"     ON "templates"("status");
CREATE INDEX IF NOT EXISTS "templates_created_at_idx" ON "templates"("created_at");

CREATE TABLE IF NOT EXISTS "tags" (
  "id"         TEXT NOT NULL,
  "name"       TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "tags_pkey"     PRIMARY KEY ("id"),
  CONSTRAINT "tags_name_key" UNIQUE ("name")
);

CREATE TABLE IF NOT EXISTS "template_tags" (
  "template_id" TEXT NOT NULL,
  "tag_id"      TEXT NOT NULL,
  CONSTRAINT "template_tags_pkey"              PRIMARY KEY ("template_id", "tag_id"),
  CONSTRAINT "template_tags_template_id_fkey"  FOREIGN KEY ("template_id") REFERENCES "templates"("id") ON DELETE CASCADE,
  CONSTRAINT "template_tags_tag_id_fkey"       FOREIGN KEY ("tag_id")      REFERENCES "tags"("id")
);

CREATE TABLE IF NOT EXISTS "template_favorites" (
  "id"          TEXT NOT NULL,
  "user_id"     TEXT NOT NULL,
  "template_id" TEXT NOT NULL,
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "template_favorites_pkey"               PRIMARY KEY ("id"),
  CONSTRAINT "template_favorites_user_template_key"  UNIQUE ("user_id", "template_id"),
  CONSTRAINT "template_favorites_user_id_fkey"       FOREIGN KEY ("user_id")     REFERENCES "users"("id"),
  CONSTRAINT "template_favorites_template_id_fkey"   FOREIGN KEY ("template_id") REFERENCES "templates"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "template_favorites_user_id_idx" ON "template_favorites"("user_id");

CREATE TABLE IF NOT EXISTS "template_slots" (
  "id"          TEXT NOT NULL,
  "template_id" TEXT NOT NULL,
  "slot_type"   "SlotType" NOT NULL,
  "ref_id"      TEXT NOT NULL,
  "label"       TEXT NOT NULL,
  "description" TEXT,
  "sort_order"  INTEGER NOT NULL DEFAULT 0,
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "template_slots_pkey"        PRIMARY KEY ("id"),
  CONSTRAINT "template_slots_template_fk" FOREIGN KEY ("template_id") REFERENCES "templates"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "template_slots_template_id_idx" ON "template_slots"("template_id");

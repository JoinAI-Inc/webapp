CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "user_id" TEXT,
    "user_email" TEXT,
    "user_name" TEXT,
    "user_image" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "messages_user_id_created_at_idx" ON "messages"("user_id", "created_at");
CREATE INDEX "messages_created_at_idx" ON "messages"("created_at");

ALTER TABLE "messages"
ADD CONSTRAINT "messages_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

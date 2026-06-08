ALTER TABLE "messages"
ADD COLUMN "visitor_id" TEXT;

CREATE INDEX "messages_visitor_id_created_at_idx" ON "messages"("visitor_id", "created_at");
CREATE INDEX "messages_ip_address_created_at_idx" ON "messages"("ip_address", "created_at");

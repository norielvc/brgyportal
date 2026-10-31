-- Tie KapChat citizen messages to a verified census resident (not phone alone).
ALTER TABLE kapchat_messages
  ADD COLUMN IF NOT EXISTS resident_id TEXT;

CREATE INDEX IF NOT EXISTS idx_kapchat_messages_resident_id
  ON kapchat_messages (tenant_id, resident_id)
  WHERE resident_id IS NOT NULL;

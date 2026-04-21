-- Add field for scheduled anonymization (15-day grace period)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS scheduled_anonymization_at TIMESTAMP WITH TIME ZONE;

-- Add comment for documentation
COMMENT ON COLUMN clients.scheduled_anonymization_at IS 'Timestamp when the client is scheduled for permanent anonymization (GDPR right to be forgotten with grace period).';

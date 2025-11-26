-- Custom SQL migration file: turn conversation hash from string into list of strings (monthly breakdown) --
-- Change conversation_hash from text to text[]
ALTER TABLE "conversations"
ALTER COLUMN "conversation_hash" TYPE text[]
  USING CASE
    WHEN "conversation_hash" IS NULL THEN NULL
    ELSE ARRAY["conversation_hash"]
END;
--> statement-breakpoint

-- Recreate index as GIN for array operations
DROP INDEX IF EXISTS "conversation_hash_idx";
--> statement-breakpoint
CREATE INDEX "conversation_hash_idx" ON "conversations" USING GIN ("conversation_hash");
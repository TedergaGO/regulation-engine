-- Add doc_type to policies table
ALTER TABLE policies ADD COLUMN IF NOT EXISTS doc_type VARCHAR(20) DEFAULT 'policy' NOT NULL;

-- Drop old unique constraint and replace with one that includes doc_type
DO $$ BEGIN
  ALTER TABLE policies DROP CONSTRAINT policies_tenant_id_standard_id_ref_no_key;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE policies ADD CONSTRAINT policies_doc_type_unique UNIQUE(tenant_id, standard_id, ref_no, doc_type);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

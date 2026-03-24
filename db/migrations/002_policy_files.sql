CREATE TABLE IF NOT EXISTS policy_files (
  id            SERIAL PRIMARY KEY,
  tenant_id     INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  standard_id   VARCHAR(50) NOT NULL,
  ref_no        VARCHAR(100) NOT NULL,
  filename      TEXT NOT NULL,
  stored_name   TEXT NOT NULL,
  mimetype      VARCHAR(100),
  file_size     INTEGER,
  uploaded_by   VARCHAR(255),
  note          TEXT DEFAULT '',
  uploaded_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pfiles_tenant_std ON policy_files(tenant_id, standard_id, ref_no);

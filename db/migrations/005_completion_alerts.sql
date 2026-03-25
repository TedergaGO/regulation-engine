-- 005: Control completions & review date tracking

-- Kontrol tamamlama durumu
CREATE TABLE IF NOT EXISTS control_completions (
  id            SERIAL PRIMARY KEY,
  tenant_id     INTEGER NOT NULL,
  standard_id   INTEGER NOT NULL,
  ref_no        VARCHAR(100) NOT NULL,
  is_completed  BOOLEAN DEFAULT FALSE,
  completed_at  TIMESTAMPTZ,
  completed_by  VARCHAR(255),
  notes         TEXT DEFAULT '',
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT control_completions_unique UNIQUE(tenant_id, standard_id, ref_no)
);

CREATE INDEX IF NOT EXISTS idx_ctrl_comp_tenant ON control_completions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ctrl_comp_std    ON control_completions(tenant_id, standard_id);

-- Politika tablosuna sonraki gözden geçirme tarihi
ALTER TABLE policies ADD COLUMN IF NOT EXISTS next_review_date DATE;
CREATE INDEX IF NOT EXISTS idx_policies_review ON policies(tenant_id, next_review_date);

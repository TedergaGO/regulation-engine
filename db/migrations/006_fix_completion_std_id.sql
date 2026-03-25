-- 006: standard_id VARCHAR olarak düzelt (standards.id VARCHAR'a uyumlu)
ALTER TABLE control_completions
  ALTER COLUMN standard_id TYPE VARCHAR(100) USING standard_id::varchar;

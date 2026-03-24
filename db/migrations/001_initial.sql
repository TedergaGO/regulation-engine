-- Tenants (SaaS firmaları)
CREATE TABLE IF NOT EXISTS tenants (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(255) NOT NULL,
  slug         VARCHAR(100) UNIQUE NOT NULL,
  logo_data    BYTEA,
  logo_mimetype VARCHAR(100),
  settings     JSONB DEFAULT '{}',
  plan         VARCHAR(50) DEFAULT 'starter',
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Users
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  tenant_id     INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  username      VARCHAR(100) NOT NULL,
  full_name     VARCHAR(255) NOT NULL,
  email         VARCHAR(255),
  password_hash TEXT NOT NULL,
  role          VARCHAR(20) NOT NULL DEFAULT 'editor',
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, username)
);

-- Standards
CREATE TABLE IF NOT EXISTS standards (
  id            VARCHAR(50) NOT NULL,
  tenant_id     INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name          VARCHAR(255) NOT NULL,
  short_name    VARCHAR(100),
  category      VARCHAR(255),
  version       VARCHAR(50),
  published_by  VARCHAR(255),
  description   TEXT,
  ref_format    VARCHAR(100),
  control_count INTEGER DEFAULT 0,
  status        VARCHAR(20) DEFAULT 'PRELOADED',
  color         VARCHAR(20),
  icon          VARCHAR(10),
  generated_at  DATE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY(id, tenant_id)
);

-- Controls
CREATE TABLE IF NOT EXISTS controls (
  id          SERIAL PRIMARY KEY,
  tenant_id   INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  standard_id VARCHAR(50) NOT NULL,
  ref_no      VARCHAR(100) NOT NULL,
  category    VARCHAR(255),
  title       TEXT NOT NULL,
  description TEXT,
  type        VARCHAR(20),
  priority    VARCHAR(50),
  keywords    TEXT[] DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, standard_id, ref_no)
);
CREATE INDEX IF NOT EXISTS idx_controls_tenant_std ON controls(tenant_id, standard_id);

-- Policies
CREATE TABLE IF NOT EXISTS policies (
  id               SERIAL PRIMARY KEY,
  tenant_id        INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  standard_id      VARCHAR(50) NOT NULL,
  ref_no           VARCHAR(100) NOT NULL,
  control_title    TEXT,
  current_version  VARCHAR(20) DEFAULT '1.0',
  last_modified_by VARCHAR(255),
  last_modified_at TIMESTAMPTZ DEFAULT NOW(),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, standard_id, ref_no)
);
CREATE INDEX IF NOT EXISTS idx_policies_tenant_std ON policies(tenant_id, standard_id);

-- Policy versions
CREATE TABLE IF NOT EXISTS policy_versions (
  id                 SERIAL PRIMARY KEY,
  policy_id          INTEGER NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
  version            VARCHAR(20) NOT NULL,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  created_by         VARCHAR(255) NOT NULL,
  created_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  note               TEXT DEFAULT '',
  document           JSONB NOT NULL,
  UNIQUE(policy_id, version)
);
CREATE INDEX IF NOT EXISTS idx_pv_policy_id ON policy_versions(policy_id);

-- Matrix cache
CREATE TABLE IF NOT EXISTS matrix_cache (
  id                 SERIAL PRIMARY KEY,
  tenant_id          INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  matrix_data        JSONB NOT NULL,
  created_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

-- Industry domains
CREATE TABLE IF NOT EXISTS industry_domains (
  id                   VARCHAR(50) NOT NULL,
  tenant_id            INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name                 VARCHAR(255) NOT NULL,
  icon                 VARCHAR(10),
  color                VARCHAR(20),
  description          TEXT,
  primary_standards    TEXT[] DEFAULT '{}',
  supporting_standards TEXT[] DEFAULT '{}',
  sort_order           INTEGER DEFAULT 0,
  PRIMARY KEY(id, tenant_id)
);

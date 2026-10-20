-- ============================================================================
-- Deterministic B2B Sales Operating System: PostgreSQL DDL Schema
-- Compatible with PostgreSQL 15/16 and pg_trgm extension
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

DROP TABLE IF EXISTS interactions CASCADE;
DROP TABLE IF EXISTS competitor_presence CASCADE;
DROP TABLE IF EXISTS contacts CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS companies CASCADE;

-- 1. Companies Table
CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    website VARCHAR(255),
    tier VARCHAR(50) NOT NULL DEFAULT 'Tier 2',      -- 'Tier 1' (Enterprise), 'Tier 2' (Strategic), 'Tier 3' (Growth)
    industry VARCHAR(150),
    corporate_office VARCHAR(150),
    telecom_spend VARCHAR(100),
    health_status VARCHAR(50) NOT NULL DEFAULT 'CRITICAL', -- 'CRITICAL', 'AT_RISK', 'HEALTHY'
    health_score INTEGER NOT NULL CHECK (health_score >= -100 AND health_score <= 100),
    last_meeting_date DATE,
    next_meeting_date DATE,
    open_pipeline NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    oldest_opp_days INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_companies_name_trgm ON companies USING gin (name gin_trgm_ops);
CREATE INDEX idx_companies_tier ON companies USING btree (tier);

-- 2. Contacts Table (Exact 14 Columns + is_key_contact)
CREATE TABLE contacts (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    is_key_contact BOOLEAN NOT NULL DEFAULT false,
    designation VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    contact_number VARCHAR(50),
    mobile_number VARCHAR(50),
    email_id VARCHAR(255),
    linkedin_url VARCHAR(500),
    remarks TEXT,
    last_meeting_date DATE,
    next_meeting_date DATE,
    appointment_given VARCHAR(50) DEFAULT 'No',
    appointment_date DATE,
    meeting_status VARCHAR(100) DEFAULT 'Follow-up Needed',
    product VARCHAR(255),
    opp_snapshot VARCHAR(255),
    role_type VARCHAR(100) DEFAULT 'Champion',
    disposition VARCHAR(100) DEFAULT 'Cautious / Evaluating',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_contacts_company_id ON contacts USING btree (company_id);
CREATE INDEX idx_contacts_is_key ON contacts USING btree (is_key_contact);

-- 3. Products Table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('Active', 'White-Space')),
    contract_value NUMERIC(12, 2) DEFAULT 0.00,
    renewal_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_company_id ON products USING btree (company_id);

-- 4. Competitor Presence Table
CREATE TABLE competitor_presence (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    competitor_name VARCHAR(255) NOT NULL,
    threat_level VARCHAR(50) NOT NULL CHECK (threat_level IN ('Active', 'Monitoring', 'Displaced')),
    first_detected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

CREATE INDEX idx_competitor_presence_company ON competitor_presence USING btree (company_id);

-- 5. Interactions Table
CREATE TABLE interactions (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    contact_id INTEGER REFERENCES contacts(id) ON DELETE SET NULL,
    contact_name VARCHAR(255),
    remark_text TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_interactions_company_id ON interactions USING btree (company_id);
CREATE INDEX idx_interactions_timestamp ON interactions USING btree (timestamp DESC);

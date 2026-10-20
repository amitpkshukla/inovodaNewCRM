-- ============================================================================
-- Deterministic B2B Sales Operating System: Seed Data
-- ============================================================================

-- Company 1: Apex Industrial Logistics
INSERT INTO companies (id, name, website, tier, industry, corporate_office, telecom_spend, health_status, health_score, last_meeting_date, next_meeting_date, open_pipeline, oldest_opp_days)
VALUES (1, 'Apex Industrial Logistics', 'https://apexindustrial.com', 'Tier 1', 'Supply Chain Logistics', 'Chicago, IL', '$45,000 / mo', 'CRITICAL', -50, '2026-10-18', '2026-11-04', 185000.00, 302);

-- Company 2: Vanguard Cloud Systems
INSERT INTO companies (id, name, website, tier, industry, corporate_office, telecom_spend, health_status, health_score, last_meeting_date, next_meeting_date, open_pipeline, oldest_opp_days)
VALUES (2, 'Vanguard Cloud Systems', 'https://vanguardcloud.io', 'Tier 2', 'Cloud Infrastructure', 'Austin, TX', '$28,000 / mo', 'AT_RISK', 62, '2026-10-14', '2026-11-10', 94000.00, 114);

SELECT setval('companies_id_seq', (SELECT MAX(id) FROM companies));

-- Key Contacts (is_key_contact = true) for Apex
INSERT INTO contacts (
    id, company_id, is_key_contact, designation, name, contact_number, mobile_number, email_id, linkedin_url,
    remarks, last_meeting_date, next_meeting_date, appointment_given, appointment_date, meeting_status, product, opp_snapshot, role_type, disposition
) VALUES
(
    1, 1, true, 'Chief Procurement Officer', 'Elena Rostova', '+1-312-555-0192', '+1-312-555-0144',
    'elena.rostova@apexindustrial.com', 'https://linkedin.com/in/elena-rostova',
    'Requested security redlines and updated SLA commitments before Q4 refresh.',
    '2026-10-12', '2026-10-28', 'Yes', '2026-10-28', 'Scheduled', 'Fleet Telemetry Hub', '$120k Contract Renewal',
    'Economic Buyer', 'Cautious / Evaluating'
),
(
    2, 1, true, 'VP Supply Chain Engineering', 'Marcus Vance', '+1-312-555-0188', '+1-312-555-0129',
    'marcus.vance@apexindustrial.com', 'https://linkedin.com/in/marcus-vance',
    'Internal champion. Mentioned Competitor X submitted a POC to procurement.',
    '2026-10-18', '2026-11-04', 'Pending', '2026-11-04', 'Awaiting Confirmation', 'Predictive Route Dispatch', '$65k Expansion',
    'Champion', 'Strong Champion'
);

-- Other Contacts (is_key_contact = false) for Apex
INSERT INTO contacts (
    id, company_id, is_key_contact, designation, name, contact_number, mobile_number, email_id, linkedin_url,
    remarks, last_meeting_date, next_meeting_date, appointment_given, appointment_date, meeting_status, product, opp_snapshot, role_type, disposition
) VALUES
(
    3, 1, false, 'Director of Warehouse IT', 'Derek Chen', '+1-312-555-0211', '+1-312-555-0298',
    'derek.chen@apexindustrial.com', 'https://linkedin.com/in/derek-chen-it',
    'Resistant to vendor migration. Strongly prefers legacy on-prem infrastructure.',
    '2026-09-22', NULL, 'No', NULL, 'Follow-up Needed', 'Customs Automated Clearance', 'Early Evaluation',
    'Blocker', 'Negative / Resistant'
),
(
    4, 1, false, 'Lead Integration Architect', 'Sarah Lin', '+1-312-555-0344', '+1-312-555-0312',
    'sarah.lin@apexindustrial.com', 'https://linkedin.com/in/sarah-lin-integration',
    'Benchmarking REST webhook latency and high-availability failover specs.',
    '2026-10-04', '2026-10-30', 'Yes', '2026-10-30', 'Scheduled', 'Core Platform API Mesh', 'Architecture Sync',
    'Technical Evaluator', 'Neutral'
);

-- Contacts for Vanguard Cloud Systems
INSERT INTO contacts (
    id, company_id, is_key_contact, designation, name, contact_number, mobile_number, email_id, linkedin_url,
    remarks, last_meeting_date, next_meeting_date, appointment_given, appointment_date, meeting_status, product, opp_snapshot, role_type, disposition
) VALUES
(
    5, 2, true, 'VP Platform Architecture', 'Sophia Martinez', '+1-512-555-0101', '+1-512-555-0122',
    'smartinez@vanguardcloud.io', 'https://linkedin.com/in/smartinez-cloud',
    'Architecture review completed. Zero-Trust Identity Bridge selected for POC.',
    '2026-10-14', '2026-11-10', 'Yes', '2026-11-10', 'Scheduled', 'Zero-Trust Identity Bridge', '$54k New Expansion',
    'Champion', 'Strong Champion'
),
(
    6, 2, false, 'Director of Cloud SecOps', 'Arthur Pendelton', '+1-512-555-0233', '+1-512-555-0277',
    'apendelton@vanguardcloud.io', 'https://linkedin.com/in/arthur-pendelton',
    'Reviewed audit compliance logs for SOC2 Type II.',
    '2026-09-30', '2026-11-15', 'Pending', '2026-11-15', 'Reviewing', 'Core Cluster Management', '$80k Active',
    'Economic Buyer', 'Cautious / Evaluating'
);

SELECT setval('contacts_id_seq', (SELECT MAX(id) FROM contacts));

-- Products
INSERT INTO products (id, company_id, product_name, status, contract_value, renewal_date)
VALUES
(1, 1, 'Warehouse Fleet Telemetry', 'Active', 120000.00, '2027-03-31'),
(2, 1, 'Predictive Route Dispatch', 'White-Space', 65000.00, NULL),
(3, 1, 'Automated Customs Clearance', 'White-Space', 45000.00, NULL),
(4, 2, 'Core Cluster Management', 'Active', 80000.00, '2026-12-15'),
(5, 2, 'Zero-Trust Identity Bridge', 'White-Space', 54000.00, NULL);

SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));

-- Initial Competitor
INSERT INTO competitor_presence (id, company_id, competitor_name, threat_level, notes)
VALUES
(1, 1, 'Competitor X', 'Active', 'POC proposal submitted to Elena Rostova'),
(2, 2, 'Legacy Vendor Y', 'Monitoring', 'Incumbent provider on legacy multi-tenant nodes');

SELECT setval('competitor_presence_id_seq', (SELECT MAX(id) FROM competitor_presence));

-- Initial Interactions
INSERT INTO interactions (id, company_id, contact_id, contact_name, remark_text, timestamp)
VALUES
(1, 1, 2, 'Marcus Vance', 'Marcus disclosed Competitor X submitted an RFP response to procurement.', CURRENT_TIMESTAMP - INTERVAL '1 day'),
(2, 1, 1, 'Elena Rostova', 'Initial discovery call regarding Q3 procurement cycle and vendor terms.', CURRENT_TIMESTAMP - INTERVAL '3 hours');

SELECT setval('interactions_id_seq', (SELECT MAX(id) FROM interactions));

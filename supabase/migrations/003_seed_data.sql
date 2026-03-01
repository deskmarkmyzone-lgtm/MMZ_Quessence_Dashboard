-- ============================================================
-- MMZ Dashboard — Migration 003: Seed / Demo Data
-- All inserts use ON CONFLICT DO NOTHING for safe re-runs.
-- Deterministic UUIDs are used throughout for consistency.
-- ============================================================

-- ============================================================
-- 1. MMZ Settings
-- ============================================================
-- Delete the minimal seed row from 001 so we can insert the full one
DELETE FROM mmz_settings
WHERE company_name = 'Mark My Zone'
  AND bank_account_name IS NULL;

INSERT INTO mmz_settings (
  bank_account_name, bank_name, bank_account_number, bank_ifsc, bank_branch,
  pan_number, company_name, company_address, company_phone, company_email,
  invoice_prefix, next_invoice_number
) VALUES (
  'Mark My Zone', 'HDFC Bank', 'XXXXXXXXXXXX', 'HDFC0001234',
  'Jubilee Hills, Hyderabad', 'AAACM1234A', 'Mark My Zone',
  'Hyderabad, Telangana', '+91 9876543210', 'info@markmyzone.com',
  'MMZ', 1
);

-- ============================================================
-- 2. Community
-- ============================================================
INSERT INTO communities (
  id, name, address, city, state, pincode, total_units, community_type, association_name
) VALUES (
  'c0000000-0000-0000-0000-000000000001',
  'Prestige High Fields',
  'Financial District, Nanakramguda',
  'Hyderabad', 'Telangana', '500032', 2500,
  'gated_community',
  'Prestige High Fields Apartment Owners Association'
) ON CONFLICT DO NOTHING;

-- ============================================================
-- 3. Owners (4 rows)
-- ============================================================
INSERT INTO owners (id, name, email, phone, brokerage_calc_method, brokerage_days, brokerage_percentage, brokerage_fixed_amount)
VALUES
  -- Owner 1: R. Krishna Kumar — 8 days brokerage
  ('o0000000-0000-0000-0000-000000000001', 'R. Krishna Kumar', 'krishna@gmail.com', '+91 9000000001',
   'days_of_rent', 8, NULL, NULL),
  -- Owner 2: Ajitha Reddy — percentage 10% brokerage
  ('o0000000-0000-0000-0000-000000000002', 'Ajitha Reddy', 'ajitha@gmail.com', '+91 9000000002',
   'percentage', NULL, 10.00, NULL),
  -- Owner 3: Prashanthi Madhu — 8 days brokerage
  ('o0000000-0000-0000-0000-000000000003', 'Prashanthi Madhu', 'prashanthi@gmail.com', '+91 9000000003',
   'days_of_rent', 8, NULL, NULL),
  -- Owner 4: R. Venkat Ramana — fixed 15000 brokerage
  ('o0000000-0000-0000-0000-000000000004', 'R. Venkat Ramana', 'venkat@gmail.com', '+91 9000000004',
   'fixed_amount', NULL, NULL, 15000.00)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. Flats (10 rows)
--    Flat number convention: first digit = tower, next two = floor, last = unit
--    e.g. 3154 → tower=3, floor=15, unit=4
-- ============================================================
INSERT INTO flats (id, community_id, owner_id, flat_number, tower, floor, unit, bhk_type, carpet_area_sft, base_rent, maintenance_amount, status)
VALUES
  -- Flat 1: 3154 — owner Krishna, occupied
  ('f0000000-0000-0000-0000-000000000001',
   'c0000000-0000-0000-0000-000000000001', 'o0000000-0000-0000-0000-000000000001',
   '3154', 3, 15, 4, '2.5BHK', 1492.00, 49748.00, 6252.00, 'occupied'),
  -- Flat 2: 6292 — owner Krishna, occupied
  ('f0000000-0000-0000-0000-000000000002',
   'c0000000-0000-0000-0000-000000000001', 'o0000000-0000-0000-0000-000000000001',
   '6292', 6, 29, 2, '4BHK', 2848.00, 82067.00, 11933.00, 'occupied'),
  -- Flat 3: 2282 — owner Krishna, vacant
  ('f0000000-0000-0000-0000-000000000003',
   'c0000000-0000-0000-0000-000000000001', 'o0000000-0000-0000-0000-000000000001',
   '2282', 2, 28, 2, '2BHK', 1283.00, 42000.00, 5159.00, 'vacant'),
  -- Flat 4: 3218 — owner Prashanthi, occupied
  ('f0000000-0000-0000-0000-000000000004',
   'c0000000-0000-0000-0000-000000000001', 'o0000000-0000-0000-0000-000000000003',
   '3218', 3, 21, 8, '2BHK', 1283.00, 45000.00, 5159.00, 'occupied'),
  -- Flat 5: 2095 — owner Venkat, occupied
  ('f0000000-0000-0000-0000-000000000005',
   'c0000000-0000-0000-0000-000000000001', 'o0000000-0000-0000-0000-000000000004',
   '2095', 2, 9, 5, '2BHK', 1283.00, 43000.00, 5159.00, 'occupied'),
  -- Flat 6: 3301 — owner Venkat, occupied
  ('f0000000-0000-0000-0000-000000000006',
   'c0000000-0000-0000-0000-000000000001', 'o0000000-0000-0000-0000-000000000004',
   '3301', 3, 30, 1, '2.5BHK', 1492.00, 48000.00, 6252.00, 'occupied'),
  -- Flat 7: 4101 — owner Ajitha, occupied
  ('f0000000-0000-0000-0000-000000000007',
   'c0000000-0000-0000-0000-000000000001', 'o0000000-0000-0000-0000-000000000002',
   '4101', 4, 10, 1, '3BHK', 1800.00, 58000.00, 7500.00, 'occupied'),
  -- Flat 8: 8253 — owner Ajitha, vacant
  ('f0000000-0000-0000-0000-000000000008',
   'c0000000-0000-0000-0000-000000000001', 'o0000000-0000-0000-0000-000000000002',
   '8253', 8, 25, 3, '3BHK', 1800.00, 68000.00, 8500.00, 'vacant'),
  -- Flat 9: 8061 — owner Ajitha, occupied
  ('f0000000-0000-0000-0000-000000000009',
   'c0000000-0000-0000-0000-000000000001', 'o0000000-0000-0000-0000-000000000002',
   '8061', 8, 6, 1, '2BHK', 1283.00, 41000.00, 5159.00, 'occupied'),
  -- Flat 10: 2224 — owner Krishna, occupied
  ('f0000000-0000-0000-0000-000000000010',
   'c0000000-0000-0000-0000-000000000001', 'o0000000-0000-0000-0000-000000000001',
   '2224', 2, 22, 4, '2.5BHK', 1492.00, 52000.00, 6252.00, 'occupied')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 5. Tenants (8 rows — one per occupied flat)
-- ============================================================
INSERT INTO tenants (
  id, flat_id, name, phone, email, tenant_type, occupation_type, company_name,
  bachelor_occupant_count, bachelor_gender, bachelor_gender_breakdown,
  lease_start_date, lease_end_date, security_deposit,
  monthly_rent, monthly_maintenance, monthly_inclusive_rent, rent_due_day
) VALUES
  -- Tenant 1: Flat 3154 — Rahul Kumar, family, TCS
  ('t0000000-0000-0000-0000-000000000001',
   'f0000000-0000-0000-0000-000000000001',
   'Rahul Kumar', '+91 9100000001', 'rahul.kumar@gmail.com',
   'family', 'employee', 'TCS',
   NULL, NULL, NULL,
   '2025-06-10', '2026-06-09', 112000.00,
   49748.00, 6252.00, 56000.00, 1),
  -- Tenant 2: Flat 6292 — Priya & Group (3 girls), bachelor
  ('t0000000-0000-0000-0000-000000000002',
   'f0000000-0000-0000-0000-000000000002',
   'Priya & Group', '+91 9100000002', 'priya.group@gmail.com',
   'bachelor', 'employee', NULL,
   3, 'female', '3 girls',
   '2025-08-01', '2026-07-31', 188000.00,
   82067.00, 11933.00, 94000.00, 1),
  -- Tenant 3: Flat 3218 — Amit Sharma, family, Infosys
  ('t0000000-0000-0000-0000-000000000003',
   'f0000000-0000-0000-0000-000000000004',
   'Amit Sharma', '+91 9100000003', 'amit.sharma@gmail.com',
   'family', 'employee', 'Infosys',
   NULL, NULL, NULL,
   '2025-04-15', '2026-04-14', 100000.00,
   45000.00, 5159.00, 50159.00, 1),
  -- Tenant 4: Flat 2095 — Deepak Patel, family, business_owner
  ('t0000000-0000-0000-0000-000000000004',
   'f0000000-0000-0000-0000-000000000005',
   'Deepak Patel', '+91 9100000004', 'deepak.patel@gmail.com',
   'family', 'business_owner', NULL,
   NULL, NULL, NULL,
   '2025-09-01', '2026-08-31', 96000.00,
   43000.00, 5159.00, 48159.00, 1),
  -- Tenant 5: Flat 3301 — Vikram Singh, family, Google
  ('t0000000-0000-0000-0000-000000000005',
   'f0000000-0000-0000-0000-000000000006',
   'Vikram Singh', '+91 9100000005', 'vikram.singh@gmail.com',
   'family', 'employee', 'Google',
   NULL, NULL, NULL,
   '2025-07-01', '2026-06-30', 108000.00,
   48000.00, 6252.00, 54252.00, 1),
  -- Tenant 6: Flat 4101 — Suresh Reddy, family, Amazon
  ('t0000000-0000-0000-0000-000000000006',
   'f0000000-0000-0000-0000-000000000007',
   'Suresh Reddy', '+91 9100000006', 'suresh.reddy@gmail.com',
   'family', 'employee', 'Amazon',
   NULL, NULL, NULL,
   '2025-05-01', '2026-04-30', 130000.00,
   58000.00, 7500.00, 65500.00, 1),
  -- Tenant 7: Flat 8061 — Kiran Kumar, family, Microsoft
  ('t0000000-0000-0000-0000-000000000007',
   'f0000000-0000-0000-0000-000000000009',
   'Kiran Kumar', '+91 9100000007', 'kiran.kumar@gmail.com',
   'family', 'employee', 'Microsoft',
   NULL, NULL, NULL,
   '2025-10-01', '2026-09-30', 92000.00,
   41000.00, 5159.00, 46159.00, 1),
  -- Tenant 8: Flat 2224 — Ajaypal Singh, bachelor (2 boys)
  ('t0000000-0000-0000-0000-000000000008',
   'f0000000-0000-0000-0000-000000000010',
   'Ajaypal Singh', '+91 9100000008', 'ajaypal.singh@gmail.com',
   'bachelor', 'employee', NULL,
   2, 'male', '2 boys',
   '2025-12-01', '2026-11-30', 116000.00,
   52000.00, 6252.00, 58252.00, 1)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 6. Rent Payments
--    10 months for Flat 3154 (Jun 2025 - Feb 2026),
--    plus a few for other flats
-- ============================================================
INSERT INTO rent_payments (
  id, flat_id, tenant_id, amount, payment_date, payment_month,
  payment_method, payment_status, payment_reference,
  base_rent_portion, maintenance_portion, remarks
) VALUES
  -- Flat 3154 — Jun 2025
  ('rp000000-0000-0000-0000-000000000001',
   'f0000000-0000-0000-0000-000000000001', 't0000000-0000-0000-0000-000000000001',
   56000.00, '2025-06-10', '2025-06-01',
   'bank_transfer', 'full', 'TXN-JUN2025-3154',
   49748.00, 6252.00, 'First month rent'),
  -- Flat 3154 — Jul 2025
  ('rp000000-0000-0000-0000-000000000002',
   'f0000000-0000-0000-0000-000000000001', 't0000000-0000-0000-0000-000000000001',
   56000.00, '2025-07-02', '2025-07-01',
   'gpay', 'full', 'TXN-JUL2025-3154',
   49748.00, 6252.00, NULL),
  -- Flat 3154 — Aug 2025
  ('rp000000-0000-0000-0000-000000000003',
   'f0000000-0000-0000-0000-000000000001', 't0000000-0000-0000-0000-000000000001',
   56000.00, '2025-08-01', '2025-08-01',
   'gpay', 'full', 'TXN-AUG2025-3154',
   49748.00, 6252.00, NULL),
  -- Flat 3154 — Sep 2025
  ('rp000000-0000-0000-0000-000000000004',
   'f0000000-0000-0000-0000-000000000001', 't0000000-0000-0000-0000-000000000001',
   56000.00, '2025-09-03', '2025-09-01',
   'bank_transfer', 'full', 'TXN-SEP2025-3154',
   49748.00, 6252.00, NULL),
  -- Flat 3154 — Oct 2025
  ('rp000000-0000-0000-0000-000000000005',
   'f0000000-0000-0000-0000-000000000001', 't0000000-0000-0000-0000-000000000001',
   56000.00, '2025-10-01', '2025-10-01',
   'gpay', 'full', 'TXN-OCT2025-3154',
   49748.00, 6252.00, NULL),
  -- Flat 3154 — Nov 2025
  ('rp000000-0000-0000-0000-000000000006',
   'f0000000-0000-0000-0000-000000000001', 't0000000-0000-0000-0000-000000000001',
   56000.00, '2025-11-02', '2025-11-01',
   'phonepe', 'full', 'TXN-NOV2025-3154',
   49748.00, 6252.00, NULL),
  -- Flat 3154 — Dec 2025
  ('rp000000-0000-0000-0000-000000000007',
   'f0000000-0000-0000-0000-000000000001', 't0000000-0000-0000-0000-000000000001',
   56000.00, '2025-12-01', '2025-12-01',
   'bank_transfer', 'full', 'TXN-DEC2025-3154',
   49748.00, 6252.00, NULL),
  -- Flat 3154 — Jan 2026
  ('rp000000-0000-0000-0000-000000000008',
   'f0000000-0000-0000-0000-000000000001', 't0000000-0000-0000-0000-000000000001',
   56000.00, '2026-01-03', '2026-01-01',
   'gpay', 'full', 'TXN-JAN2026-3154',
   49748.00, 6252.00, NULL),
  -- Flat 3154 — Feb 2026 (partial payment)
  ('rp000000-0000-0000-0000-000000000009',
   'f0000000-0000-0000-0000-000000000001', 't0000000-0000-0000-0000-000000000001',
   49748.00, '2026-02-05', '2026-02-01',
   'gpay', 'partial', 'TXN-FEB2026-3154',
   49748.00, 0.00, 'Maintenance portion pending'),
  -- Flat 3154 — Feb 2026 (remaining maintenance)
  ('rp000000-0000-0000-0000-000000000010',
   'f0000000-0000-0000-0000-000000000001', 't0000000-0000-0000-0000-000000000001',
   6252.00, '2026-02-10', '2026-02-01',
   'gpay', 'full', 'TXN-FEB2026-3154-MAINT',
   0.00, 6252.00, 'Maintenance portion cleared'),
  -- Flat 6292 — Aug 2025
  ('rp000000-0000-0000-0000-000000000011',
   'f0000000-0000-0000-0000-000000000002', 't0000000-0000-0000-0000-000000000002',
   94000.00, '2025-08-01', '2025-08-01',
   'bank_transfer', 'full', 'TXN-AUG2025-6292',
   82067.00, 11933.00, 'First month rent'),
  -- Flat 3218 — Apr 2025
  ('rp000000-0000-0000-0000-000000000012',
   'f0000000-0000-0000-0000-000000000004', 't0000000-0000-0000-0000-000000000003',
   50159.00, '2025-04-15', '2025-04-01',
   'bank_transfer', 'full', 'TXN-APR2025-3218',
   45000.00, 5159.00, 'First month rent'),
  -- Flat 4101 — May 2025
  ('rp000000-0000-0000-0000-000000000013',
   'f0000000-0000-0000-0000-000000000007', 't0000000-0000-0000-0000-000000000006',
   65500.00, '2025-05-01', '2025-05-01',
   'upi', 'full', 'TXN-MAY2025-4101',
   58000.00, 7500.00, 'First month rent'),
  -- Flat 2095 — Sep 2025
  ('rp000000-0000-0000-0000-000000000014',
   'f0000000-0000-0000-0000-000000000005', 't0000000-0000-0000-0000-000000000004',
   48159.00, '2025-09-01', '2025-09-01',
   'gpay', 'full', 'TXN-SEP2025-2095',
   43000.00, 5159.00, 'First month rent'),
  -- Flat 3301 — Jul 2025
  ('rp000000-0000-0000-0000-000000000015',
   'f0000000-0000-0000-0000-000000000006', 't0000000-0000-0000-0000-000000000005',
   54252.00, '2025-07-01', '2025-07-01',
   'bank_transfer', 'full', 'TXN-JUL2025-3301',
   48000.00, 6252.00, 'First month rent')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 7. Expenses (5 rows across different flats/categories)
-- ============================================================
INSERT INTO expenses (
  id, flat_id, category, description, amount, expense_date,
  vendor_name, vendor_phone, reported_by, paid_by, recovery_status, remarks
) VALUES
  -- Expense 1: Deep cleaning for Flat 3154
  ('e0000000-0000-0000-0000-000000000001',
   'f0000000-0000-0000-0000-000000000001',
   'deep_cleaning', 'Full flat deep cleaning before tenant move-in',
   3500.00, '2025-06-08',
   'Clean Homes Services', '+91 9200000001',
   'pm_inspection', 'owner', 'included_in_statement',
   'Pre-move-in cleaning'),
  -- Expense 2: AC repair for Flat 6292
  ('e0000000-0000-0000-0000-000000000002',
   'f0000000-0000-0000-0000-000000000002',
   'ac', 'AC gas refill and service for master bedroom unit',
   2800.00, '2025-09-15',
   'Cool Air Solutions', '+91 9200000002',
   'tenant', 'pm', 'pending',
   'Tenant reported AC not cooling'),
  -- Expense 3: Plumbing for Flat 3218
  ('e0000000-0000-0000-0000-000000000003',
   'f0000000-0000-0000-0000-000000000004',
   'plumbing', 'Kitchen sink leakage repair and pipe replacement',
   1500.00, '2025-07-20',
   'Quick Fix Plumbing', '+91 9200000003',
   'tenant', 'owner', 'recovered',
   'Minor leakage fixed'),
  -- Expense 4: Paint for Flat 2282 (vacant)
  ('e0000000-0000-0000-0000-000000000004',
   'f0000000-0000-0000-0000-000000000003',
   'paint', 'Full flat repainting — walls and ceiling',
   18000.00, '2025-11-10',
   'Colour World Painters', '+91 9200000004',
   'pm_inspection', 'owner', 'included_in_statement',
   'Flat vacant, preparing for new tenant'),
  -- Expense 5: Electrical for Flat 4101
  ('e0000000-0000-0000-0000-000000000005',
   'f0000000-0000-0000-0000-000000000007',
   'electrical', 'Replacement of faulty MCB and wiring in kitchen',
   4200.00, '2025-12-05',
   'Bright Spark Electricals', '+91 9200000005',
   'owner', 'pm', 'pending',
   'Owner reported during visit')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 8. Audit Log (5 rows)
-- ============================================================
INSERT INTO audit_log (
  id, actor_type, actor_id, actor_name, actor_role,
  action, entity_type, entity_id, description, metadata
) VALUES
  -- Login event
  ('al000000-0000-0000-0000-000000000001',
   'pm_user', NULL, 'System Admin', 'super_admin',
   'login', 'pm_user', 'al000000-0000-0000-0000-000000000001',
   'Admin logged into the dashboard',
   '{"ip_address": "192.168.1.100", "browser": "Chrome 120"}'::jsonb),
  -- Create community
  ('al000000-0000-0000-0000-000000000002',
   'pm_user', NULL, 'System Admin', 'super_admin',
   'create', 'community', 'c0000000-0000-0000-0000-000000000001',
   'Created community: Prestige High Fields',
   '{"community_name": "Prestige High Fields", "total_units": 2500}'::jsonb),
  -- Create flat
  ('al000000-0000-0000-0000-000000000003',
   'pm_user', NULL, 'System Admin', 'super_admin',
   'create', 'flat', 'f0000000-0000-0000-0000-000000000001',
   'Created flat 3154 in Prestige High Fields for owner R. Krishna Kumar',
   '{"flat_number": "3154", "owner_name": "R. Krishna Kumar"}'::jsonb),
  -- Record rent payment
  ('al000000-0000-0000-0000-000000000004',
   'pm_user', NULL, 'System Admin', 'admin',
   'create', 'rent_payment', 'rp000000-0000-0000-0000-000000000001',
   'Recorded rent payment of Rs. 56,000 for flat 3154 — Jun 2025',
   '{"flat_number": "3154", "amount": 56000, "month": "Jun 2025"}'::jsonb),
  -- Export statement
  ('al000000-0000-0000-0000-000000000005',
   'pm_user', NULL, 'System Admin', 'admin',
   'export', 'flat', 'f0000000-0000-0000-0000-000000000001',
   'Exported rental credit report for flat 3154',
   '{"flat_number": "3154", "export_format": "pdf"}'::jsonb)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 9. Notifications (3 rows)
-- ============================================================
INSERT INTO notifications (
  id, recipient_type, recipient_id, notification_type,
  title, message, entity_type, entity_id, is_read
) VALUES
  -- Rent overdue notification
  ('n0000000-0000-0000-0000-000000000001',
   'pm_user', 'al000000-0000-0000-0000-000000000001',
   'rent_overdue',
   'Rent Overdue — Flat 3154',
   'Rent for flat 3154 (tenant: Rahul Kumar) for February 2026 was partially paid. Maintenance portion of Rs. 6,252 is pending.',
   'flat', 'f0000000-0000-0000-0000-000000000001',
   false),
  -- Lease expiring notification
  ('n0000000-0000-0000-0000-000000000002',
   'pm_user', 'al000000-0000-0000-0000-000000000001',
   'lease_expiring',
   'Lease Expiring — Flat 3218',
   'Lease for flat 3218 (tenant: Amit Sharma) expires on 2026-04-14. Please initiate renewal or exit process.',
   'tenant', 't0000000-0000-0000-0000-000000000003',
   false),
  -- Tenant added notification
  ('n0000000-0000-0000-0000-000000000003',
   'owner', 'o0000000-0000-0000-0000-000000000001',
   'tenant_added',
   'New Tenant Added — Flat 2224',
   'A new tenant Ajaypal Singh has been added to your flat 2224 in Prestige High Fields. Lease period: Dec 2025 to Nov 2026.',
   'tenant', 't0000000-0000-0000-0000-000000000008',
   true)
ON CONFLICT DO NOTHING;

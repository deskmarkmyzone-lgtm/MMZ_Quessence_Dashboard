-- ============================================================
-- MMZ Dashboard — Initial Schema
-- ============================================================

-- Custom enum types
CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'manager');
CREATE TYPE flat_status AS ENUM ('occupied', 'vacant', 'under_maintenance');
CREATE TYPE tenant_type AS ENUM ('family', 'bachelor');
CREATE TYPE tenant_gender AS ENUM ('male', 'female', 'mixed');
CREATE TYPE occupation_type AS ENUM ('employee', 'business_owner');
CREATE TYPE payment_method AS ENUM ('gpay', 'phonepe', 'bank_transfer', 'cash', 'upi', 'cheque', 'other');
CREATE TYPE payment_status AS ENUM ('full', 'partial', 'unpaid');
CREATE TYPE expense_category AS ENUM ('deep_cleaning', 'paint', 'electrical', 'plumbing', 'ac', 'geyser', 'carpentry', 'pest_control', 'chimney', 'other');
CREATE TYPE expense_reporter AS ENUM ('tenant', 'pm_inspection', 'owner');
CREATE TYPE expense_payer AS ENUM ('pm', 'owner', 'tenant');
CREATE TYPE recovery_status AS ENUM ('pending', 'included_in_statement', 'recovered');
CREATE TYPE document_type AS ENUM ('brokerage_invoice', 'expenses_bill', 'maintenance_tracker', 'rental_credit_report', 'flat_annexure');
CREATE TYPE document_status AS ENUM ('draft', 'pending_approval', 'approved', 'published', 'rejected');
CREATE TYPE brokerage_calc_method AS ENUM ('days_of_rent', 'percentage', 'fixed_amount');
CREATE TYPE communication_pref AS ENUM ('whatsapp', 'email', 'both');
CREATE TYPE notification_type AS ENUM (
  'rent_overdue', 'lease_expiring', 'document_approved', 'document_rejected',
  'expense_recorded', 'statement_published', 'tenant_added', 'tenant_exited',
  'maintenance_updated', 'team_member_added', 'owner_onboarded'
);
CREATE TYPE audit_action AS ENUM ('create', 'update', 'delete', 'approve', 'reject', 'publish', 'login', 'export');
CREATE TYPE annexure_condition AS ENUM ('good', 'fair', 'poor', 'damaged', 'missing', 'new');

-- ============================================================
-- PM TEAM USERS
-- ============================================================
CREATE TABLE pm_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'manager',
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES pm_users(id)
);

-- ============================================================
-- COMMUNITIES
-- ============================================================
CREATE TABLE communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  city TEXT DEFAULT 'Hyderabad',
  state TEXT DEFAULT 'Telangana',
  pincode TEXT,
  total_units INTEGER,
  community_type TEXT,
  contact_person_name TEXT,
  contact_person_phone TEXT,
  contact_person_email TEXT,
  association_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES pm_users(id)
);

-- ============================================================
-- OWNERS
-- ============================================================
CREATE TABLE owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  pan_number TEXT,
  address TEXT,
  city TEXT,
  pincode TEXT,
  brokerage_calc_method brokerage_calc_method DEFAULT 'days_of_rent',
  brokerage_days INTEGER DEFAULT 8,
  brokerage_percentage DECIMAL(5,2),
  brokerage_fixed_amount DECIMAL(12,2),
  gst_applicable BOOLEAN DEFAULT false,
  gst_number TEXT,
  communication_pref communication_pref DEFAULT 'both',
  family_group_id UUID,
  family_group_name TEXT,
  is_family_head BOOLEAN DEFAULT false,
  onboarding_token TEXT UNIQUE,
  onboarding_completed BOOLEAN DEFAULT false,
  onboarded_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES pm_users(id)
);

CREATE INDEX idx_owners_email ON owners(email);
CREATE INDEX idx_owners_family_group ON owners(family_group_id);

-- ============================================================
-- FLATS
-- ============================================================
CREATE TABLE flats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  flat_number TEXT NOT NULL,
  tower INTEGER,
  floor INTEGER,
  unit INTEGER,
  bhk_type TEXT NOT NULL,
  carpet_area_sft DECIMAL(10,2),
  base_rent DECIMAL(12,2) NOT NULL DEFAULT 0,
  maintenance_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  inclusive_rent DECIMAL(12,2) GENERATED ALWAYS AS (base_rent + maintenance_amount) STORED,
  rent_due_day INTEGER DEFAULT 1 CHECK (rent_due_day BETWEEN 1 AND 28),
  status flat_status DEFAULT 'vacant',
  management_fee_override DECIMAL(12,2),
  vacant_maintenance_amount DECIMAL(12,2),
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES pm_users(id),
  UNIQUE(community_id, flat_number)
);

CREATE INDEX idx_flats_community ON flats(community_id);
CREATE INDEX idx_flats_owner ON flats(owner_id);
CREATE INDEX idx_flats_status ON flats(status);
CREATE INDEX idx_flats_flat_number ON flats(flat_number);

-- ============================================================
-- TENANTS
-- ============================================================
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flat_id UUID NOT NULL REFERENCES flats(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  tenant_type tenant_type NOT NULL DEFAULT 'family',
  occupation_type occupation_type,
  company_name TEXT,
  business_name TEXT,
  family_member_count INTEGER,
  bachelor_occupant_count INTEGER,
  bachelor_gender tenant_gender,
  bachelor_gender_breakdown TEXT,
  aadhaar_file_id TEXT,
  pan_file_id TEXT,
  employment_proof_file_id TEXT,
  business_proof_file_id TEXT,
  spouse_aadhaar_file_id TEXT,
  agreement_file_id TEXT,
  lease_start_date DATE,
  lease_end_date DATE,
  security_deposit DECIMAL(12,2),
  monthly_rent DECIMAL(12,2) NOT NULL,
  monthly_maintenance DECIMAL(12,2),
  monthly_inclusive_rent DECIMAL(12,2),
  rent_due_day INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  exit_date DATE,
  exit_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES pm_users(id)
);

CREATE INDEX idx_tenants_flat ON tenants(flat_id);
CREATE INDEX idx_tenants_active ON tenants(is_active);

-- ============================================================
-- BACHELOR OCCUPANTS
-- ============================================================
CREATE TABLE bachelor_occupants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  gender TEXT,
  phone TEXT,
  aadhaar_file_id TEXT,
  employment_proof_file_id TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_bachelor_occupants_tenant ON bachelor_occupants(tenant_id);

-- ============================================================
-- RENT PAYMENTS
-- ============================================================
CREATE TABLE rent_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flat_id UUID NOT NULL REFERENCES flats(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_month DATE NOT NULL,
  payment_method payment_method NOT NULL,
  payment_status payment_status NOT NULL DEFAULT 'full',
  payment_reference TEXT,
  proof_file_ids TEXT[],
  base_rent_portion DECIMAL(12,2),
  maintenance_portion DECIMAL(12,2),
  remarks TEXT,
  recorded_by UUID REFERENCES pm_users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_rent_payments_flat ON rent_payments(flat_id);
CREATE INDEX idx_rent_payments_month ON rent_payments(payment_month);
CREATE INDEX idx_rent_payments_tenant ON rent_payments(tenant_id);

-- ============================================================
-- EXPENSES / REPAIRS
-- ============================================================
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flat_id UUID NOT NULL REFERENCES flats(id) ON DELETE CASCADE,
  category expense_category NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  expense_date DATE NOT NULL,
  vendor_name TEXT,
  vendor_phone TEXT,
  reported_by expense_reporter NOT NULL DEFAULT 'pm_inspection',
  paid_by expense_payer NOT NULL DEFAULT 'pm',
  recovery_status recovery_status DEFAULT 'pending',
  recovery_statement_id UUID,
  receipt_file_ids TEXT[],
  remarks TEXT,
  recorded_by UUID REFERENCES pm_users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_expenses_flat ON expenses(flat_id);
CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_expenses_recovery ON expenses(recovery_status);

-- ============================================================
-- COMMUNITY MAINTENANCE CHARGES
-- ============================================================
CREATE TABLE community_maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flat_id UUID NOT NULL REFERENCES flats(id) ON DELETE CASCADE,
  quarter TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  maintenance_amount DECIMAL(12,2) NOT NULL,
  previous_pending DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) GENERATED ALWAYS AS (maintenance_amount + previous_pending) STORED,
  is_paid BOOLEAN DEFAULT false,
  paid_date DATE,
  paid_by TEXT,
  recorded_by UUID REFERENCES pm_users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_community_maintenance_flat ON community_maintenance(flat_id);
CREATE INDEX idx_community_maintenance_quarter ON community_maintenance(quarter);

-- ============================================================
-- FLAT ANNEXURE
-- ============================================================
CREATE TABLE flat_annexures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flat_id UUID NOT NULL REFERENCES flats(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id),
  annexure_type TEXT NOT NULL,
  annexure_date DATE NOT NULL,
  security_deposit DECIMAL(12,2),
  total_deductions DECIMAL(12,2) DEFAULT 0,
  refund_amount DECIMAL(12,2),
  refund_bank_name TEXT,
  refund_bank_account TEXT,
  refund_bank_ifsc TEXT,
  refund_account_holder TEXT,
  pdf_file_id TEXT,
  is_completed BOOLEAN DEFAULT false,
  created_by UUID REFERENCES pm_users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE annexure_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  annexure_id UUID NOT NULL REFERENCES flat_annexures(id) ON DELETE CASCADE,
  room_name TEXT NOT NULL,
  room_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE annexure_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES annexure_rooms(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  condition_move_in annexure_condition,
  condition_move_out annexure_condition,
  remarks TEXT,
  item_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE annexure_deductions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  annexure_id UUID NOT NULL REFERENCES flat_annexures(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  deduction_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- DOCUMENTS / STATEMENTS / INVOICES
-- ============================================================
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type document_type NOT NULL,
  document_number TEXT UNIQUE,
  owner_id UUID NOT NULL REFERENCES owners(id),
  family_group_id UUID,
  community_id UUID REFERENCES communities(id),
  period_label TEXT,
  period_start DATE,
  period_end DATE,
  subtotal DECIMAL(12,2),
  tds_amount DECIMAL(12,2),
  gst_amount DECIMAL(12,2),
  grand_total DECIMAL(12,2),
  line_items JSONB NOT NULL DEFAULT '[]',
  status document_status DEFAULT 'draft',
  created_by UUID REFERENCES pm_users(id),
  submitted_by UUID REFERENCES pm_users(id),
  submitted_at TIMESTAMPTZ,
  approved_by UUID REFERENCES pm_users(id),
  approved_at TIMESTAMPTZ,
  rejected_by UUID REFERENCES pm_users(id),
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  published_by UUID REFERENCES pm_users(id),
  published_at TIMESTAMPTZ,
  pdf_file_id TEXT,
  excel_file_id TEXT,
  bank_details JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_documents_owner ON documents(owner_id);
CREATE INDEX idx_documents_type ON documents(document_type);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_number ON documents(document_number);

-- ============================================================
-- RENT REVISIONS
-- ============================================================
CREATE TABLE rent_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flat_id UUID NOT NULL REFERENCES flats(id) ON DELETE CASCADE,
  old_base_rent DECIMAL(12,2) NOT NULL,
  new_base_rent DECIMAL(12,2) NOT NULL,
  old_maintenance DECIMAL(12,2),
  new_maintenance DECIMAL(12,2),
  old_inclusive_rent DECIMAL(12,2),
  new_inclusive_rent DECIMAL(12,2),
  percentage_change DECIMAL(5,2),
  revision_date DATE NOT NULL,
  reason TEXT,
  effective_from DATE,
  recorded_by UUID REFERENCES pm_users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_rent_revisions_flat ON rent_revisions(flat_id);

-- ============================================================
-- NOTES / COMMENTS
-- ============================================================
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT true,
  author_type TEXT NOT NULL,
  author_id UUID NOT NULL,
  author_name TEXT NOT NULL,
  mentioned_user_ids UUID[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notes_entity ON notes(entity_type, entity_id);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_type TEXT NOT NULL,
  recipient_id UUID NOT NULL,
  notification_type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notifications_recipient ON notifications(recipient_type, recipient_id);
CREATE INDEX idx_notifications_unread ON notifications(recipient_type, recipient_id, is_read) WHERE is_read = false;

-- ============================================================
-- NOTIFICATION PREFERENCES
-- ============================================================
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_type TEXT NOT NULL,
  user_id UUID NOT NULL,
  notification_type notification_type NOT NULL,
  in_app_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_type, user_id, notification_type)
);

-- ============================================================
-- AUDIT LOG
-- ============================================================
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_type TEXT NOT NULL,
  actor_id UUID,
  actor_name TEXT,
  actor_role TEXT,
  action audit_action NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  description TEXT NOT NULL,
  changes JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_actor ON audit_log(actor_type, actor_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at DESC);

-- ============================================================
-- FILE REFERENCES
-- ============================================================
CREATE TABLE file_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_drive_file_id TEXT NOT NULL,
  google_drive_url TEXT,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size_bytes INTEGER,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  file_category TEXT,
  uploaded_by UUID REFERENCES pm_users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_file_references_entity ON file_references(entity_type, entity_id);
CREATE INDEX idx_file_references_drive ON file_references(google_drive_file_id);

-- ============================================================
-- MMZ SETTINGS
-- ============================================================
CREATE TABLE mmz_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_account_name TEXT,
  bank_name TEXT,
  bank_account_number TEXT,
  bank_ifsc TEXT,
  bank_branch TEXT,
  pan_number TEXT,
  gst_number TEXT,
  invoice_prefix TEXT DEFAULT 'MMZ',
  next_invoice_number INTEGER DEFAULT 1,
  company_name TEXT DEFAULT 'Mark My Zone',
  company_address TEXT,
  company_phone TEXT,
  company_email TEXT,
  google_drive_root_folder_id TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES pm_users(id)
);

-- ============================================================
-- USER VIEW PREFERENCES
-- ============================================================
CREATE TABLE user_view_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_type TEXT NOT NULL,
  user_id UUID NOT NULL,
  screen_name TEXT NOT NULL,
  view_mode TEXT DEFAULT 'list',
  sort_column TEXT,
  sort_direction TEXT DEFAULT 'asc',
  filters JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_type, user_id, screen_name)
);

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_pm_users_updated_at BEFORE UPDATE ON pm_users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_communities_updated_at BEFORE UPDATE ON communities FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_owners_updated_at BEFORE UPDATE ON owners FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_flats_updated_at BEFORE UPDATE ON flats FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_rent_payments_updated_at BEFORE UPDATE ON rent_payments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_community_maintenance_updated_at BEFORE UPDATE ON community_maintenance FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-generate document number
CREATE OR REPLACE FUNCTION generate_document_number()
RETURNS TRIGGER AS $$
DECLARE
  prefix TEXT;
  year TEXT;
  next_num INTEGER;
BEGIN
  SELECT invoice_prefix INTO prefix FROM mmz_settings LIMIT 1;
  IF prefix IS NULL THEN prefix := 'MMZ'; END IF;

  year := EXTRACT(YEAR FROM now())::TEXT;

  SELECT COALESCE(MAX(
    CAST(SPLIT_PART(document_number, '/', 4) AS INTEGER)
  ), 0) + 1 INTO next_num
  FROM documents
  WHERE document_number LIKE prefix || '/' ||
    CASE NEW.document_type
      WHEN 'brokerage_invoice' THEN 'INV'
      WHEN 'expenses_bill' THEN 'EXP'
      WHEN 'maintenance_tracker' THEN 'MNT'
      WHEN 'rental_credit_report' THEN 'RCR'
      WHEN 'flat_annexure' THEN 'ANX'
    END || '/' || year || '/%';

  NEW.document_number := prefix || '/' ||
    CASE NEW.document_type
      WHEN 'brokerage_invoice' THEN 'INV'
      WHEN 'expenses_bill' THEN 'EXP'
      WHEN 'maintenance_tracker' THEN 'MNT'
      WHEN 'rental_credit_report' THEN 'RCR'
      WHEN 'flat_annexure' THEN 'ANX'
    END || '/' || year || '/' || LPAD(next_num::TEXT, 4, '0');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_document_number_trigger
  BEFORE INSERT ON documents
  FOR EACH ROW
  WHEN (NEW.document_number IS NULL)
  EXECUTE FUNCTION generate_document_number();

-- Auto-log rent revisions when flat rent changes
CREATE OR REPLACE FUNCTION log_rent_revision()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.base_rent IS DISTINCT FROM NEW.base_rent OR OLD.maintenance_amount IS DISTINCT FROM NEW.maintenance_amount THEN
    INSERT INTO rent_revisions (flat_id, old_base_rent, new_base_rent, old_maintenance, new_maintenance, old_inclusive_rent, new_inclusive_rent, percentage_change, revision_date)
    VALUES (
      NEW.id,
      OLD.base_rent,
      NEW.base_rent,
      OLD.maintenance_amount,
      NEW.maintenance_amount,
      OLD.base_rent + OLD.maintenance_amount,
      NEW.base_rent + NEW.maintenance_amount,
      CASE WHEN OLD.base_rent + OLD.maintenance_amount > 0
        THEN ROUND(((NEW.base_rent + NEW.maintenance_amount) - (OLD.base_rent + OLD.maintenance_amount)) / (OLD.base_rent + OLD.maintenance_amount) * 100, 2)
        ELSE 0
      END,
      CURRENT_DATE
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_rent_revision_trigger
  AFTER UPDATE ON flats
  FOR EACH ROW
  EXECUTE FUNCTION log_rent_revision();

-- ============================================================
-- SEED DATA
-- ============================================================

-- Insert default MMZ settings
INSERT INTO mmz_settings (company_name, company_address, invoice_prefix, next_invoice_number)
VALUES ('Mark My Zone', 'Hyderabad, Telangana, India', 'MMZ', 1);

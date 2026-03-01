// ===== Enums (matching Postgres enums) =====

export type UserRole = "super_admin" | "admin" | "manager";
export type FlatStatus = "occupied" | "vacant" | "under_maintenance";
export type TenantType = "family" | "bachelor";
export type TenantGender = "male" | "female" | "mixed";
export type OccupationType = "employee" | "business_owner";
export type PaymentMethod = "gpay" | "phonepe" | "bank_transfer" | "cash" | "upi" | "cheque" | "other";
export type PaymentStatus = "full" | "partial" | "unpaid";
export type ExpenseCategory = "deep_cleaning" | "paint" | "electrical" | "plumbing" | "ac" | "geyser" | "carpentry" | "pest_control" | "chimney" | "other";
export type ExpenseReporter = "tenant" | "pm_inspection" | "owner";
export type ExpensePayer = "pm" | "owner" | "tenant";
export type RecoveryStatus = "pending" | "included_in_statement" | "recovered";
export type DocumentType = "brokerage_invoice" | "expenses_bill" | "maintenance_tracker" | "rental_credit_report" | "flat_annexure";
export type DocumentStatus = "draft" | "pending_approval" | "approved" | "published" | "rejected";
export type BrokerageCalcMethod = "days_of_rent" | "percentage" | "fixed_amount";
export type CommunicationPref = "whatsapp" | "email" | "both";
export type AuditAction = "create" | "update" | "delete" | "approve" | "reject" | "publish" | "login" | "export";
export type NotificationType = "rent_overdue" | "lease_expiring" | "document_approved" | "document_rejected" | "expense_recorded" | "statement_published" | "tenant_added" | "tenant_exited" | "maintenance_updated" | "team_member_added" | "owner_onboarded";
export type AnnexureCondition = "good" | "fair" | "poor" | "damaged" | "missing" | "new";

// ===== Database Row Types =====

export interface Community {
  id: string;
  name: string;
  address: string | null;
  city: string;
  state: string;
  pincode: string | null;
  total_units: number | null;
  community_type: string | null;
  contact_person_name: string | null;
  contact_person_phone: string | null;
  contact_person_email: string | null;
  association_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface Owner {
  id: string;
  auth_user_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  pan_number: string | null;
  address: string | null;
  city: string | null;
  pincode: string | null;
  brokerage_calc_method: BrokerageCalcMethod;
  brokerage_days: number;
  brokerage_percentage: number | null;
  brokerage_fixed_amount: number | null;
  gst_applicable: boolean;
  gst_number: string | null;
  communication_pref: CommunicationPref;
  family_group_id: string | null;
  family_group_name: string | null;
  is_family_head: boolean;
  onboarding_token: string | null;
  onboarding_completed: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface Flat {
  id: string;
  community_id: string;
  owner_id: string;
  flat_number: string;
  tower: number | null;
  floor: number | null;
  unit: number | null;
  bhk_type: string;
  carpet_area_sft: number | null;
  base_rent: number;
  maintenance_amount: number;
  inclusive_rent: number;
  rent_due_day: number;
  status: FlatStatus;
  management_fee_override: number | null;
  vacant_maintenance_amount: number | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  // Joined data
  community?: Community;
  owner?: Owner;
  tenant?: Tenant;
}

export interface Tenant {
  id: string;
  flat_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  tenant_type: TenantType;
  occupation_type: OccupationType | null;
  company_name: string | null;
  business_name: string | null;
  family_member_count: number | null;
  bachelor_occupant_count: number | null;
  bachelor_gender: TenantGender | null;
  bachelor_gender_breakdown: string | null;
  aadhaar_file_id: string | null;
  pan_file_id: string | null;
  employment_proof_file_id: string | null;
  business_proof_file_id: string | null;
  spouse_aadhaar_file_id: string | null;
  agreement_file_id: string | null;
  lease_start_date: string | null;
  lease_end_date: string | null;
  security_deposit: number | null;
  monthly_rent: number;
  monthly_maintenance: number | null;
  monthly_inclusive_rent: number | null;
  rent_due_day: number;
  is_active: boolean;
  exit_date: string | null;
  exit_reason: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface RentPayment {
  id: string;
  flat_id: string;
  tenant_id: string;
  amount: number;
  payment_date: string;
  payment_month: string;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  payment_reference: string | null;
  proof_file_ids: string[] | null;
  base_rent_portion: number | null;
  maintenance_portion: number | null;
  remarks: string | null;
  recorded_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  flat?: Flat;
  tenant?: Tenant;
}

export interface Expense {
  id: string;
  flat_id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  expense_date: string;
  vendor_name: string | null;
  vendor_phone: string | null;
  reported_by: ExpenseReporter;
  paid_by: ExpensePayer;
  recovery_status: RecoveryStatus;
  recovery_statement_id: string | null;
  receipt_file_ids: string[] | null;
  remarks: string | null;
  recorded_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  flat?: Flat;
}

export interface CommunityMaintenance {
  id: string;
  flat_id: string;
  quarter: string;
  period_start: string;
  period_end: string;
  maintenance_amount: number;
  previous_pending: number;
  total_amount: number;
  is_paid: boolean;
  paid_date: string | null;
  paid_by: string | null;
  recorded_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  document_type: DocumentType;
  document_number: string | null;
  owner_id: string;
  family_group_id: string | null;
  community_id: string | null;
  period_label: string | null;
  period_start: string | null;
  period_end: string | null;
  subtotal: number | null;
  tds_amount: number | null;
  gst_amount: number | null;
  grand_total: number | null;
  line_items: unknown[];
  status: DocumentStatus;
  created_by: string | null;
  submitted_by: string | null;
  submitted_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  published_by: string | null;
  published_at: string | null;
  rejection_reason: string | null;
  pdf_file_id: string | null;
  bank_details: unknown | null;
  payment_received: boolean;
  payment_received_amount: number | null;
  payment_received_date: string | null;
  payment_received_method: string | null;
  payment_received_reference: string | null;
  payment_received_by: string | null;
  created_at: string;
  updated_at: string;
}

// ===== Form Input Types =====

export interface CommunityInput {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  total_units?: number;
  community_type?: string;
  contact_person_name?: string;
  contact_person_phone?: string;
  contact_person_email?: string;
  association_name?: string;
}

export interface OwnerInput {
  name: string;
  email: string;
  phone?: string;
  pan_number?: string;
  address?: string;
  city?: string;
  pincode?: string;
  brokerage_calc_method?: BrokerageCalcMethod;
  brokerage_days?: number;
  brokerage_percentage?: number;
  brokerage_fixed_amount?: number;
  gst_applicable?: boolean;
  gst_number?: string;
  communication_pref?: CommunicationPref;
  family_group_name?: string;
}

export interface FlatInput {
  community_id: string;
  owner_id: string;
  flat_number: string;
  bhk_type: string;
  carpet_area_sft?: number;
  base_rent: number;
  maintenance_amount: number;
  rent_due_day?: number;
  status?: FlatStatus;
  notes?: string;
}

-- Migration: Add owner payment tracking columns to documents table
-- Tracks whether owners have paid MMZ's invoices (brokerage, expense bills)

ALTER TABLE documents ADD COLUMN IF NOT EXISTS payment_received BOOLEAN DEFAULT false;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS payment_received_amount DECIMAL(12,2);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS payment_received_date DATE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS payment_received_method TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS payment_received_reference TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS payment_received_by UUID REFERENCES pm_users(id);

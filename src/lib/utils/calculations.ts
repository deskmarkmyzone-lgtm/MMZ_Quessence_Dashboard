import type { BrokerageCalcMethod } from "@/types";

/**
 * Calculate brokerage fee, TDS, and net amount
 */
export function calculateBrokerage(
  inclusiveRent: number,
  method: BrokerageCalcMethod,
  value: number
): { brokerage: number; tds: number; net: number } {
  let brokerage: number;

  switch (method) {
    case "days_of_rent":
      brokerage = Math.round((inclusiveRent / 30) * value);
      break;
    case "percentage":
      brokerage = Math.round(inclusiveRent * (value / 100));
      break;
    case "fixed_amount":
      brokerage = value;
      break;
  }

  const tds = Math.round(brokerage * 0.02); // 2% TDS
  const net = brokerage - tds;

  return { brokerage, tds, net };
}

/**
 * Calculate inclusive rent from base rent and maintenance
 */
export function calculateInclusiveRent(
  baseRent: number,
  maintenance: number
): number {
  return baseRent + maintenance;
}

/**
 * Calculate deposit refund after deductions
 */
export function calculateDepositRefund(
  securityDeposit: number,
  deductions: { description: string; amount: number }[]
): { totalDeductions: number; refundAmount: number } {
  const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
  const refundAmount = securityDeposit - totalDeductions;
  return { totalDeductions, refundAmount };
}

/**
 * Calculate maintenance from carpet area
 * Rate: Rs.4.2 per sq ft
 */
export const MAINTENANCE_RATE = 4.2;

export function calculateMaintenance(carpetAreaSft: number): number {
  return Math.round(carpetAreaSft * MAINTENANCE_RATE);
}

/**
 * BHK options for flat forms
 */
export const BHK_OPTIONS = [
  { value: "1", label: "1 BHK" },
  { value: "1.5", label: "1.5 BHK" },
  { value: "2", label: "2 BHK" },
  { value: "2.5", label: "2.5 BHK" },
  { value: "3", label: "3 BHK" },
  { value: "3.5", label: "3.5 BHK" },
  { value: "4", label: "4 BHK" },
];

/**
 * Expense category labels
 */
export const EXPENSE_CATEGORIES = [
  { value: "deep_cleaning", label: "Deep Cleaning" },
  { value: "paint", label: "Paint / Touch Up" },
  { value: "electrical", label: "Electrical" },
  { value: "plumbing", label: "Plumbing" },
  { value: "ac", label: "AC Servicing" },
  { value: "geyser", label: "Geyser Servicing" },
  { value: "carpentry", label: "Carpentry" },
  { value: "pest_control", label: "Pest Control" },
  { value: "chimney", label: "Chimney" },
  { value: "other", label: "Other" },
];

/**
 * Payment method labels
 */
export const PAYMENT_METHODS = [
  { value: "gpay", label: "GPay" },
  { value: "phonepe", label: "PhonePe" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "upi", label: "UPI" },
  { value: "cash", label: "Cash" },
  { value: "cheque", label: "Cheque" },
  { value: "other", label: "Other" },
];

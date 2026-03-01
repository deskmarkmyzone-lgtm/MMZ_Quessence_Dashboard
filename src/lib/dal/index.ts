// Auth
export {
  getCurrentAuthUser,
  getPmUser,
  getOwnerByAuthId,
  getOwnerByEmail,
} from "./auth";

// Communities
export {
  getCommunities,
  getCommunityById,
  getCommunityWithStats,
} from "./communities";

// Owners
export { getOwners, getOwnerById, getOwnersList } from "./owners";

// Flats
export {
  getFlats,
  getFlatById,
  getFlatsList,
  getOccupiedFlatsForRentRecording,
} from "./flats";

// Tenants
export {
  getActiveTenantByFlatId,
  getTenantById,
  getPastTenantsByFlatId,
} from "./tenants";

// Rent Payments
export {
  getRentPayments,
  getRentPaymentsByFlatId,
  getMonthlyRentGrid,
} from "./rent-payments";

// Expenses
export { getExpenses, getExpensesByFlatId } from "./expenses";

// Documents
export {
  getDocuments,
  getDocumentById,
  getPendingApprovals,
} from "./documents";

// Maintenance
export { getMaintenance, getMaintenanceByFlatId } from "./maintenance";

// Notifications
export { getNotifications, getUnreadCount } from "./notifications";

// Audit Log
export { getAuditLog } from "./audit-log";

// Settings
export { getSettings, getTeamMembers } from "./settings";

// Dashboard
export {
  getDashboardKPIs,
  getRecentActivity,
  getVacantFlats,
  getAlerts,
} from "./dashboard";

export type { ActionResult } from "./types";

export { logAudit } from "./audit";

export {
  createCommunity,
  updateCommunity,
  deleteCommunity,
} from "./communities";

export { createOwner, updateOwner, generateOnboardingToken } from "./owners";

export { createFlat, updateFlat } from "./flats";

export { createTenant, updateTenant, exitTenant } from "./tenants";

export { recordRentPayment, fetchRentPaymentsForFlat } from "./rent-payments";
export type { RentPaymentSummary } from "./rent-payments";

export { recordExpense } from "./expenses";

export { recordMaintenance } from "./maintenance";

export {
  createDocument,
  submitForApproval,
  approveDocument,
  rejectDocument,
  publishDocument,
  recordDocumentPayment,
  deleteDocument,
  renameDocument,
} from "./documents";

export {
  createNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "./notifications";

export {
  updateBankDetails,
  updateInvoiceSettings,
  updateCalculationSettings,
  addTeamMember,
  updateTeamMemberRole,
  deactivateTeamMember,
  updateNotificationPreferences,
} from "./settings";

export { uploadFile, getFileUrl } from "./storage";

export { addNote, getNotesByEntity } from "./notes";

export { checkLeaseExpirations } from "./lease-alerts";

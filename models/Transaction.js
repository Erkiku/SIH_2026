const tableName = "transactions";

const VALID_STATUSES = [
  "pending",
  "processing",
  "completed",
  "failed",
  "refunded",
];
const VALID_PAYMENT_METHODS = ["bank_transfer", "upi", "cash", "cheque"];

/**
 * Validate transaction data
 */
function validate(data) {
  const errors = [];

  if (!data.bookingId) {
    errors.push("Booking ID is required");
  }

  if (!data.farmerId) {
    errors.push("Farmer ID is required");
  }

  if (
    data.totalAmount !== undefined &&
    (typeof data.totalAmount !== "number" || data.totalAmount < 0)
  ) {
    errors.push("Total amount must be a non-negative number");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Format DB row to API response
 */
function format(row) {
  if (!row) return null;
  return {
    id: row.id,
    bookingId: row.booking_id,
    farmerId: row.farmer_id,
    centerId: row.center_id,
    quantity: row.quantity,
    rate: row.rate,
    totalAmount: row.total_amount,
    amount: row.final_amount || row.total_amount, // Frontend alias
    deductions: row.deductions,
    finalAmount: row.final_amount,
    paymentMethod: row.payment_method,
    transactionId: row.transaction_ref_id,
    status: row.status,
    receiptUrl: row.receipt_url,
    procurementOfficer: row.procurement_officer,
    createdAt: row.created_at,
  };
}

module.exports = {
  tableName,
  validate,
  format,
  VALID_STATUSES,
  VALID_PAYMENT_METHODS,
};

const tableName = "bookings";

const VALID_STATUSES = [
  "pending",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
];
const VALID_PAYMENT_STATUSES = ["pending", "processing", "completed", "failed"];

/**
 * Validate booking creation data
 */
function validate(data) {
  const errors = [];

  if (!data.centerId) {
    errors.push("Center ID is required");
  }

  if (!data.appointmentDate) {
    errors.push("Appointment date is required");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Generate a unique token number
 */
function generateTokenNumber() {
  const prefix = "TKN";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Format DB row to API response
 */
function format(row) {
  if (!row) return null;
  return {
    id: row.id,
    farmerId: row.farmer_id,
    cropId: row.crop_id,
    centerId: row.center_id,
    slotId: row.slot_id,
    tokenNumber: row.token_number,
    bookingDate: row.booking_date,
    appointmentDate: row.appointment_date,
    appointmentTime: row.appointment_time,
    slot: row.appointment_time, // Frontend alias
    status: row.status,
    estimatedWaitTime: row.estimated_wait_time,
    currentPosition: row.current_position,
    paymentAmount: row.payment_amount,
    totalAmount: row.payment_amount, // Frontend alias
    paymentStatus: row.payment_status,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

/**
 * Map API input to DB columns
 */
function toDbRow(data, farmerId) {
  return {
    farmer_id: farmerId,
    crop_id: data.cropId,
    center_id: data.centerId,
    slot_id: data.slotId,
    token_number: generateTokenNumber(),
    booking_date: new Date().toISOString(),
    appointment_date: data.appointmentDate,
    appointment_time: data.appointmentTime || data.slot,
    status: "confirmed",
    estimated_wait_time: data.estimatedWaitTime || 30,
    current_position: data.currentPosition || 0,
    payment_amount: data.paymentAmount || data.totalAmount || 0,
    payment_status: "pending",
    notes: data.notes || "",
  };
}

module.exports = {
  tableName,
  validate,
  format,
  toDbRow,
  generateTokenNumber,
  VALID_STATUSES,
  VALID_PAYMENT_STATUSES,
};

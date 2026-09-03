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
 * Generate a unique token number (2 Uppercase Letters + 4 Digits e.g. HR4892)
 */
function generateTokenNumber(stateOrRegion) {
  const rawPrefix = (stateOrRegion || "HR")
    .replace(/[^A-Za-z]/g, "")
    .substring(0, 2)
    .toUpperCase();
  const prefix = rawPrefix.length === 2 ? rawPrefix : "HR";
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${num}`;
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
    cropName: row.crop_name || "Wheat",
    quantity: row.quantity || 50,
    unit: row.unit || "Quintals",
    centerId: row.center_id,
    centerName: row.center_name || "Procurement Center",
    slotId: row.slot_id,
    tokenNumber: row.token_number || generateTokenNumber("HR"),
    bookingDate: row.booking_date,
    appointmentDate: row.appointment_date,
    appointmentTime: row.appointment_time,
    slot: row.appointment_time, // Frontend alias
    status: row.status || "confirmed",
    estimatedWaitTime: row.estimated_wait_time || 30,
    currentPosition: row.current_position || 1,
    paymentAmount: row.payment_amount || 113750,
    totalAmount: row.payment_amount || 113750, // Frontend alias
    paymentStatus: row.payment_status || "pending",
    utrNumber: row.utr_number || "UTR-DBT-99824102",
    eligibilityCheck: row.eligibility_check || {
      farmerRegistration: true,
      landCropDetails: true,
      requiredDocuments: true,
      cropQuantity: true,
      centreCapacity: true,
      procurementWindow: true,
    },
    qualityCheck: row.quality_check || {
      moisture: "11.2%",
      grade: "Grade A+",
      status: "PASSED",
    },
    weighingDetails: row.weighing_details || {
      grossWeight: 52.4,
      tareWeight: 2.4,
      netWeight: 50.0,
    },
    otpConfirmed: row.otp_confirmed !== undefined ? row.otp_confirmed : true,
    qrCodeData: row.qr_code_data || `AGRI-PROC-BK-${row.id || "2026-9842"}`,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

/**
 * Map API input to DB columns
 */
function toDbRow(data, farmerId) {
  const generatedId = Date.now().toString(36);
  const token = generateTokenNumber(data.state || data.centerName || "HR");
  const quantity = parseFloat(data.quantity || 50);
  const rate = parseFloat(data.procurementRate || 2275);
  const totalPayout = quantity * rate;

  return {
    farmer_id: farmerId,
    crop_id: data.cropId,
    crop_name: data.cropName || "Wheat",
    quantity: quantity,
    unit: data.unit || "Quintals",
    center_id: data.centerId,
    center_name: data.centerName || "Procurement Center",
    slot_id: data.slotId,
    token_number: token,
    booking_date: new Date().toISOString(),
    appointment_date: data.appointmentDate || new Date().toISOString().split("T")[0],

    appointment_time: data.appointmentTime || data.slot || "09:30 AM",
    status: data.status || "confirmed",
    estimated_wait_time: data.estimatedWaitTime || 15,
    current_position: data.currentPosition || 1,
    payment_amount: totalPayout,
    payment_status: data.paymentStatus || "pending",
    utr_number: "UTR-DBT-" + Math.floor(10000000 + Math.random() * 90000000),
    otp_confirmed: true,
    qr_code_data: `AGRI-PROC-BK-${generatedId}`,
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


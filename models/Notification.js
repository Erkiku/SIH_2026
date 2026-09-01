const tableName = "notifications";

const VALID_TYPES = [
  "booking_confirmed",
  "booking_cancelled",
  "queue_update",
  "quality_result",
  "payment_received",
  "slot_reminder",
  "general",
];

/**
 * Validate notification data
 */
function validate(data) {
  const errors = [];

  if (!data.farmerId) {
    errors.push("Farmer ID is required");
  }

  if (!data.title || typeof data.title !== "string") {
    errors.push("Title is required");
  }

  if (!data.message || typeof data.message !== "string") {
    errors.push("Message is required");
  }

  if (data.type && !VALID_TYPES.includes(data.type)) {
    errors.push(`Type must be one of: ${VALID_TYPES.join(", ")}`);
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
    farmerId: row.farmer_id,
    bookingId: row.booking_id,
    type: row.type,
    title: row.title,
    message: row.message,
    isRead: row.is_read,
    actionUrl: row.action_url,
    createdAt: row.created_at,
  };
}

/**
 * Create a notification DB row
 */
function toDbRow(data) {
  return {
    farmer_id: data.farmerId,
    booking_id: data.bookingId || null,
    type: data.type || "general",
    title: data.title,
    message: data.message,
    is_read: false,
    action_url: data.actionUrl || null,
  };
}

module.exports = { tableName, validate, format, toDbRow, VALID_TYPES };

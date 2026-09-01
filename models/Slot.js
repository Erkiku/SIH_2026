const tableName = "slots";

const VALID_STATUSES = ["available", "full", "closed"];

/**
 * Validate slot data
 */
function validate(data) {
  const errors = [];

  if (!data.centerId) {
    errors.push("Center ID is required");
  }

  if (!data.date) {
    errors.push("Date is required");
  }

  if (!data.timeSlot || typeof data.timeSlot !== "string") {
    errors.push("Time slot is required");
  }

  if (
    data.availableSpots !== undefined &&
    (typeof data.availableSpots !== "number" || data.availableSpots < 0)
  ) {
    errors.push("Available spots must be a non-negative number");
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
    centerId: row.center_id,
    date: row.date,
    timeSlot: row.time_slot,
    availableSpots: row.available_spots,
    bookedSpots: row.booked_spots,
    status: row.status,
    createdAt: row.created_at,
  };
}

/**
 * Map API input to DB columns
 */
function toDbRow(data) {
  return {
    center_id: data.centerId,
    date: data.date,
    time_slot: data.timeSlot,
    available_spots: data.availableSpots || 10,
    booked_spots: data.bookedSpots || 0,
    status: data.status || "available",
  };
}

module.exports = { tableName, validate, format, toDbRow, VALID_STATUSES };

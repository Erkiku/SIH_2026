const tableName = "procurement_centers";

/**
 * Validate center data
 */
function validate(data) {
  const errors = [];

  if (!data.centerName || typeof data.centerName !== "string") {
    errors.push("Center name is required");
  }

  if (!data.location || typeof data.location !== "string") {
    errors.push("Location is required");
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
    centerName: row.center_name,
    name: row.center_name, // Frontend alias
    location: row.location,
    district: row.district,
    address: row.address,
    phone: row.phone,
    latitude: row.lat,
    longitude: row.lng,
    coordinates: {
      lat: row.lat,
      lng: row.lng,
    },
    managerId: row.manager_id,
    totalCapacity: row.total_capacity,
    capacity: row.total_capacity, // Frontend alias
    currentQueue: row.current_queue,
    operatingHours: row.operating_hours || "9:00 AM - 6:00 PM",
    isOpen: row.is_open !== undefined ? row.is_open : true,
    facilities: row.facilities || [],
    createdAt: row.created_at,
  };
}

module.exports = { tableName, validate, format };

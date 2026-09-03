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
    totalCapacity: row.total_capacity || 1000,
    capacity: row.total_capacity || 1000, // Frontend alias
    availableCapacity: row.available_capacity || (row.total_capacity ? Math.max(0, row.total_capacity - (row.current_queue * 40)) : 450),
    currentQueue: row.current_queue || 0,
    todayCrowd: row.today_crowd || (row.current_queue > 10 ? "High Crowd" : row.current_queue > 4 ? "Medium Crowd" : "Low Crowd"),
    distance: row.distance || "4.2 km",
    procurementRate: row.procurement_rate || 2275,
    qualityRequirements: row.quality_requirements || [
      "Moisture content < 12.0%",
      "Foreign matter < 1.0%",
      "Grain damage / discolored < 2.0%",
      "Proper gunny bag packaging"
    ],
    operatingHours: row.operating_hours || "9:00 AM - 6:00 PM",
    isOpen: row.is_open !== undefined ? row.is_open : true,
    facilities: row.facilities || [],
    createdAt: row.created_at,
  };
}

module.exports = { tableName, validate, format };


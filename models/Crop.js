const tableName = "crops";

const VALID_UNITS = ["quintal", "tonnes", "bags", "kg"];
const VALID_STATUSES = ["pending", "verified", "rejected"];
const VALID_CATEGORIES = [
  "cereal",
  "pulse",
  "vegetable",
  "fruit",
  "oilSeed",
  "spice",
];

/**
 * Validate crop creation data
 */
function validate(data) {
  const errors = [];

  if (!data.cropName || typeof data.cropName !== "string") {
    errors.push("Crop name is required");
  }

  if (
    data.quantity !== undefined &&
    (typeof data.quantity !== "number" || data.quantity <= 0)
  ) {
    errors.push("Quantity must be a positive number");
  }

  if (data.unit && !VALID_UNITS.includes(data.unit)) {
    errors.push(`Unit must be one of: ${VALID_UNITS.join(", ")}`);
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
    cropName: row.crop_name,
    name: row.crop_name, // Frontend alias
    cropVariety: row.crop_variety,
    category: row.category || "cereal",
    quantity: row.quantity,
    quantityKg: row.quantity, // Frontend uses quantityKg
    unit: row.unit,
    harvestDate: row.harvest_date,
    storageLocation: row.storage_location,
    moistureContent: row.moisture_content,
    photos: row.photos || [],
    status: row.status,
    pricePerKg: row.price_per_kg || 0,
    qualityGrade: row.quality_grade || "Pending",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Map API input to DB columns
 */
function toDbRow(data, farmerId) {
  return {
    farmer_id: farmerId,
    crop_name: data.cropName || data.name,
    crop_variety: data.cropVariety,
    category: data.category || "cereal",
    quantity: data.quantity || data.quantityKg,
    unit: data.unit || "kg",
    harvest_date: data.harvestDate,
    storage_location: data.storageLocation,
    moisture_content: data.moistureContent,
    photos: data.photos || [],
    status: data.status || "pending",
    price_per_kg: data.pricePerKg || 0,
    quality_grade: data.qualityGrade,
  };
}

module.exports = {
  tableName,
  validate,
  format,
  toDbRow,
  VALID_UNITS,
  VALID_STATUSES,
  VALID_CATEGORIES,
};

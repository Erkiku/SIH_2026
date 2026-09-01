const tableName = "farmers";

/**
 * Validate farmer registration data
 */
function validate(data) {
  const errors = [];

  if (!data.phone || typeof data.phone !== "string" || data.phone.length < 10) {
    errors.push("Valid phone number is required (min 10 digits)");
  }

  if (
    !data.name ||
    typeof data.name !== "string" ||
    data.name.trim().length < 2
  ) {
    errors.push("Name is required (min 2 characters)");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate profile update data
 */
function validateUpdate(data) {
  const errors = [];
  const allowedFields = [
    "name",
    "email",
    "address",
    "state",
    "district",
    "pincode",
    "bank_account",
    "bank_ifsc",
    "profile_photo",
    "device_id",
  ];

  const keys = Object.keys(data);
  const invalidKeys = keys.filter((k) => !allowedFields.includes(k));

  if (invalidKeys.length > 0) {
    errors.push(`Invalid fields: ${invalidKeys.join(", ")}`);
  }

  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push("Invalid email format");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Format DB row to API response
 * Maps snake_case DB columns to camelCase for Flutter frontend
 */
function format(row) {
  if (!row) return null;
  return {
    id: row.id,
    phone: row.phone,
    name: row.name,
    email: row.email,
    address: row.address,
    state: row.state,
    district: row.district,
    village: row.address, // Frontend expects 'village', map from address
    pincode: row.pincode,
    bankAccount: row.bank_account,
    bankIFSC: row.bank_ifsc,
    profilePhoto: row.profile_photo,
    profileImageUrl: row.profile_photo, // Frontend alias
    isVerified: row.is_verified,
    deviceId: row.device_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

module.exports = { tableName, validate, validateUpdate, format };

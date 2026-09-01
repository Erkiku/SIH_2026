const tableName = "quality_checks";

const VALID_GRADES = ["A+", "A", "B+", "B", "C", "D", "Rejected"];
const VALID_STATUSES = ["pending", "in_progress", "completed"];

/**
 * Validate quality check data
 */
function validate(data) {
  const errors = [];

  if (!data.bookingId) {
    errors.push("Booking ID is required");
  }

  if (!data.cropId) {
    errors.push("Crop ID is required");
  }

  if (data.overallGrade && !VALID_GRADES.includes(data.overallGrade)) {
    errors.push(`Grade must be one of: ${VALID_GRADES.join(", ")}`);
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
    cropId: row.crop_id,
    centerId: row.center_id,
    inspectorName: row.inspector_name,
    inspectionDate: row.inspection_date,
    qualityParameters: row.quality_parameters || {},
    moistureLevel: row.quality_parameters?.moistureContent || 0,
    purityScore: row.quality_parameters
      ? 100 - (row.quality_parameters.foreignMatter || 0)
      : 0,
    overallGrade: row.overall_grade,
    result: row.overall_grade, // Frontend alias
    comments: row.comments,
    remarks: row.comments, // Frontend alias
    recommendations: row.recommendations,
    photosAfterInspection: row.photos_after_inspection || [],
    status: row.status,
    checkedAt: row.inspection_date || row.created_at, // Frontend alias
    createdAt: row.created_at,
  };
}

module.exports = { tableName, validate, format, VALID_GRADES, VALID_STATUSES };

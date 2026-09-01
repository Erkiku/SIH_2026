const { supabase } = require("../config/db");
const QualityCheckModel = require("../models/QualityCheck");

/**
 * GET /api/quality/:bookingId
 * Get quality check results for a booking
 */
const getQualityCheck = async (req, res, next) => {
  try {
    const { bookingId } = req.params;

    const { data: qualityCheck, error } = await supabase
      .from(QualityCheckModel.tableName)
      .select("*")
      .eq("booking_id", bookingId)
      .single();

    if (error || !qualityCheck) {
      return res.status(404).json({
        success: false,
        message: "Quality check not found for this booking.",
      });
    }

    res.json({
      success: true,
      data: QualityCheckModel.format(qualityCheck),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/quality/history/:farmerId
 * Get all quality check records for a farmer
 */
const getQualityHistory = async (req, res, next) => {
  try {
    const { farmerId } = req.params;

    // Get all bookings for this farmer, then their quality checks
    const { data: bookings } = await supabase
      .from("bookings")
      .select("id")
      .eq("farmer_id", farmerId);

    if (!bookings || bookings.length === 0) {
      return res.json({
        success: true,
        data: [],
        count: 0,
      });
    }

    const bookingIds = bookings.map((b) => b.id);

    const { data: qualityChecks, error } = await supabase
      .from(QualityCheckModel.tableName)
      .select("*")
      .in("booking_id", bookingIds)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: (qualityChecks || []).map(QualityCheckModel.format),
      count: qualityChecks ? qualityChecks.length : 0,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getQualityCheck, getQualityHistory };

const { supabase } = require("../config/db");
const CenterModel = require("../models/ProcurementCenter");
const SlotModel = require("../models/Slot");
const {
  sortByDistance,
  isValidCoordinates,
} = require("../services/locationService");

/**
 * GET /api/centers
 * Get all procurement centers
 */
const getAllCenters = async (req, res, next) => {
  try {
    const { data: centers, error } = await supabase
      .from(CenterModel.tableName)
      .select("*")
      .order("center_name", { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      data: (centers || []).map(CenterModel.format),
      count: centers ? centers.length : 0,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/centers/:id
 * Get center details
 */
const getCenterById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: center, error } = await supabase
      .from(CenterModel.tableName)
      .select("*")
      .eq("id", id)
      .single();

    if (error || !center) {
      return res.status(404).json({
        success: false,
        message: "Procurement center not found.",
      });
    }

    res.json({
      success: true,
      data: CenterModel.format(center),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/centers/:id/slots
 * Get available slots for a center
 */
const getCenterSlots = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    let query = supabase
      .from(SlotModel.tableName)
      .select("*")
      .eq("center_id", id)
      .eq("status", "available")
      .order("date", { ascending: true })
      .order("time_slot", { ascending: true });

    // Filter by date if provided
    if (date) {
      query = query.eq("date", date);
    } else {
      // Only future slots
      query = query.gte("date", new Date().toISOString().split("T")[0]);
    }

    const { data: slots, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: (slots || []).map(SlotModel.format),
      count: slots ? slots.length : 0,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/centers/:id/queue
 * Get current queue status for a center
 */
const getCenterQueue = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get center info
    const { data: center } = await supabase
      .from(CenterModel.tableName)
      .select("current_queue, total_capacity")
      .eq("id", id)
      .single();

    if (!center) {
      return res.status(404).json({
        success: false,
        message: "Center not found.",
      });
    }

    // Get today's active bookings for this center
    const today = new Date().toISOString().split("T")[0];
    const { data: activeBookings, error } = await supabase
      .from("bookings")
      .select("id, token_number, current_position, status")
      .eq("center_id", id)
      .eq("appointment_date", today)
      .in("status", ["confirmed", "in_progress"])
      .order("current_position", { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      data: {
        centerId: id,
        currentQueue: center.current_queue || 0,
        totalCapacity: center.total_capacity || 0,
        activeBookings: activeBookings ? activeBookings.length : 0,
        queue: (activeBookings || []).map((b) => ({
          tokenNumber: b.token_number,
          position: b.current_position,
          status: b.status,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/centers/nearby?lat=X&lng=Y&radius=50
 * Get nearby centers based on GPS coordinates
 */
const getNearbyCenters = async (req, res, next) => {
  try {
    const { lat, lng, radius } = req.query;

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const maxRadius = parseFloat(radius) || 50; // Default 50km

    if (!isValidCoordinates(userLat, userLng)) {
      return res.status(400).json({
        success: false,
        message: "Valid latitude and longitude are required.",
      });
    }

    // Get all centers
    const { data: centers, error } = await supabase
      .from(CenterModel.tableName)
      .select("*");

    if (error) throw error;

    // Calculate distance and sort
    const nearbyCenters = sortByDistance(
      centers || [],
      userLat,
      userLng,
      maxRadius,
    );

    res.json({
      success: true,
      data: nearbyCenters.map((c) => ({
        ...CenterModel.format(c),
        distance: c.distance, // Distance in km
      })),
      count: nearbyCenters.length,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllCenters,
  getCenterById,
  getCenterSlots,
  getCenterQueue,
  getNearbyCenters,
};

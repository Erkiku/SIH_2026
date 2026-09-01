const express = require("express");
const router = express.Router();
const { supabase } = require("../config/db");
const SlotModel = require("../models/Slot");

/**
 * GET /api/slots/center/:centerId
 * Get available slots for a center
 */
router.get("/center/:centerId", async (req, res, next) => {
  try {
    const { centerId } = req.params;
    const { date } = req.query;

    let query = supabase
      .from(SlotModel.tableName)
      .select("*")
      .eq("center_id", centerId)
      .order("date", { ascending: true })
      .order("time_slot", { ascending: true });

    if (date) {
      query = query.eq("date", date);
    } else {
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
});

module.exports = router;

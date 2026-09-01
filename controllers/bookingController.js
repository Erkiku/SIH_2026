const { supabase } = require("../config/db");
const BookingModel = require("../models/Booking");
const NotificationModel = require("../models/Notification");

/**
 * POST /api/bookings
 * Create a new booking
 */
const createBooking = async (req, res, next) => {
  try {
    const farmerId = req.farmerId;
    const data = req.body;

    // Validate
    const validation = BookingModel.validate(data);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.errors,
      });
    }

    // Check slot availability
    const { data: slot, error: slotError } = await supabase
      .from("slots")
      .select("*")
      .eq("id", data.slotId)
      .single();

    if (slotError || !slot) {
      return res.status(404).json({
        success: false,
        message: "Slot not found.",
      });
    }

    if (
      slot.status !== "available" ||
      slot.booked_spots >= slot.available_spots
    ) {
      return res.status(400).json({
        success: false,
        message: "Slot is full. Please choose another slot.",
      });
    }

    // Get current queue position
    const { count: queueCount } = await supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("center_id", data.centerId)
      .eq("appointment_date", data.appointmentDate)
      .in("status", ["confirmed", "in_progress"]);

    // Create booking with position
    const dbRow = BookingModel.toDbRow(data, farmerId);
    dbRow.current_position = (queueCount || 0) + 1;
    dbRow.estimated_wait_time = ((queueCount || 0) + 1) * 15; // 15 min per person

    const { data: booking, error } = await supabase
      .from("bookings")
      .insert(dbRow)
      .select()
      .single();

    if (error) throw error;

    // Update slot booked_spots
    await supabase
      .from("slots")
      .update({
        booked_spots: slot.booked_spots + 1,
        status:
          slot.booked_spots + 1 >= slot.available_spots ? "full" : "available",
      })
      .eq("id", data.slotId);

    // Update center current_queue
    await supabase
      .from("procurement_centers")
      .update({ current_queue: (queueCount || 0) + 1 })
      .eq("id", data.centerId);

    // Create notification
    await supabase.from("notifications").insert(
      NotificationModel.toDbRow({
        farmerId,
        bookingId: booking.id,
        type: "booking_confirmed",
        title: "Booking Confirmed!",
        message: `Your booking has been confirmed. Token: ${booking.token_number}. Position: ${booking.current_position}`,
      }),
    );

    res.status(201).json({
      success: true,
      message: "Booking created successfully.",
      data: BookingModel.format(booking),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/bookings
 * Get all bookings for the logged-in farmer
 */
const getBookings = async (req, res, next) => {
  try {
    const farmerId = req.farmerId;
    const { status } = req.query;

    let query = supabase
      .from("bookings")
      .select("*")
      .eq("farmer_id", farmerId)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data: bookings, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: (bookings || []).map(BookingModel.format),
      count: bookings ? bookings.length : 0,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/bookings/:id
 * Get specific booking details
 */
const getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const farmerId = req.farmerId;

    const { data: booking, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", id)
      .eq("farmer_id", farmerId)
      .single();

    if (error || !booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    res.json({
      success: true,
      data: BookingModel.format(booking),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/bookings/:id
 * Update a booking
 */
const updateBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const farmerId = req.farmerId;
    const data = req.body;

    // Check ownership
    const { data: existing } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", id)
      .eq("farmer_id", farmerId)
      .single();

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    if (existing.status === "completed" || existing.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: `Cannot update a ${existing.status} booking.`,
      });
    }

    const updateData = {};
    if (data.appointmentDate !== undefined)
      updateData.appointment_date = data.appointmentDate;
    if (data.appointmentTime !== undefined)
      updateData.appointment_time = data.appointmentTime;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const { data: updated, error } = await supabase
      .from("bookings")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: "Booking updated successfully.",
      data: BookingModel.format(updated),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/bookings/:id
 * Cancel a booking
 */
const cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const farmerId = req.farmerId;

    const { data: booking } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", id)
      .eq("farmer_id", farmerId)
      .single();

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    if (booking.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel a completed booking.",
      });
    }

    // Update booking status
    const { data: cancelled, error } = await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Free up the slot
    if (booking.slot_id) {
      const { data: slot } = await supabase
        .from("slots")
        .select("booked_spots")
        .eq("id", booking.slot_id)
        .single();

      if (slot) {
        await supabase
          .from("slots")
          .update({
            booked_spots: Math.max(0, slot.booked_spots - 1),
            status: "available",
          })
          .eq("id", booking.slot_id);
      }
    }

    // Create notification
    await supabase.from("notifications").insert(
      NotificationModel.toDbRow({
        farmerId,
        bookingId: id,
        type: "booking_cancelled",
        title: "Booking Cancelled",
        message: `Your booking (Token: ${booking.token_number}) has been cancelled.`,
      }),
    );

    res.json({
      success: true,
      message: "Booking cancelled successfully.",
      data: BookingModel.format(cancelled),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/bookings/:id/status
 * Get real-time booking status
 */
const getBookingStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const farmerId = req.farmerId;

    const { data: booking, error } = await supabase
      .from("bookings")
      .select(
        "id, status, current_position, estimated_wait_time, token_number, payment_status",
      )
      .eq("id", id)
      .eq("farmer_id", farmerId)
      .single();

    if (error || !booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    res.json({
      success: true,
      data: {
        id: booking.id,
        tokenNumber: booking.token_number,
        status: booking.status,
        currentPosition: booking.current_position,
        estimatedWaitTime: booking.estimated_wait_time,
        paymentStatus: booking.payment_status,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/bookings/:id/position
 * Get queue position
 */
const getQueuePosition = async (req, res, next) => {
  try {
    const { id } = req.params;
    const farmerId = req.farmerId;

    const { data: booking } = await supabase
      .from("bookings")
      .select("id, center_id, appointment_date, current_position, token_number")
      .eq("id", id)
      .eq("farmer_id", farmerId)
      .single();

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    // Count how many people are ahead
    const { count } = await supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("center_id", booking.center_id)
      .eq("appointment_date", booking.appointment_date)
      .in("status", ["confirmed", "in_progress"])
      .lt("current_position", booking.current_position);

    res.json({
      success: true,
      data: {
        bookingId: booking.id,
        tokenNumber: booking.token_number,
        currentPosition: booking.current_position,
        peopleAhead: count || 0,
        estimatedWaitMinutes: (count || 0) * 15,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  getBookings,
  getBookingById,
  updateBooking,
  cancelBooking,
  getBookingStatus,
  getQueuePosition,
};

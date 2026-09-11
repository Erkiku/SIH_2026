const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { supabase } = require("../config/db");
const BookingModel = require("../models/Booking");
const FarmerModel = require("../models/Farmer");

// Hardcoded admin credentials for prototype
const ADMIN_CREDENTIALS = {
  email: "admin@agriprocure.gov.in",
  password: "admin2026",
  name: "Admin Officer",
  role: "admin",
};

/**
 * POST /api/admin/login
 * Admin login with email and password
 */
const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    // Check against hardcoded admin credentials
    if (
      email !== ADMIN_CREDENTIALS.email ||
      password !== ADMIN_CREDENTIALS.password
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials.",
      });
    }

    // Generate admin JWT
    const fallbackJwt = "farmer_procurement_jwt_secret_2026_sih";
    const token = jwt.sign(
      {
        adminId: "admin-001",
        email: ADMIN_CREDENTIALS.email,
        role: "admin",
        name: ADMIN_CREDENTIALS.name,
      },
      process.env.JWT_SECRET || fallbackJwt,
      { expiresIn: "24h" }
    );

    res.status(200).json({
      success: true,
      message: "Admin login successful",
      data: {
        token,
        admin: {
          id: "admin-001",
          email: ADMIN_CREDENTIALS.email,
          name: ADMIN_CREDENTIALS.name,
          role: "admin",
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/dashboard
 * Get dashboard statistics
 */
const getDashboardStats = async (req, res, next) => {
  try {
    // Get booking counts by status
    const { count: totalBookings } = await supabase
      .from("bookings")
      .select("id", { count: "exact", head: true });

    const { count: pendingBookings } = await supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");

    const { count: confirmedBookings } = await supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("status", "confirmed");

    const { count: inProgressBookings } = await supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("status", "in_progress");

    const { count: completedBookings } = await supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("status", "completed");

    const { count: cancelledBookings } = await supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("status", "cancelled");

    // Get farmer count
    const { count: totalFarmers } = await supabase
      .from("farmers")
      .select("id", { count: "exact", head: true });

    // Get center count
    const { count: totalCenters } = await supabase
      .from("procurement_centers")
      .select("id", { count: "exact", head: true });

    res.json({
      success: true,
      data: {
        totalBookings: totalBookings || 0,
        pendingBookings: pendingBookings || 0,
        confirmedBookings: confirmedBookings || 0,
        inProgressBookings: inProgressBookings || 0,
        completedBookings: completedBookings || 0,
        cancelledBookings: cancelledBookings || 0,
        totalFarmers: totalFarmers || 0,
        totalCenters: totalCenters || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/bookings
 * Get all bookings for admin dashboard
 */
const getAllBookings = async (req, res, next) => {
  try {
    const { status, date, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (date) {
      query = query.eq("appointment_date", date);
    }

    const { data: bookings, error } = await query;

    if (error) throw error;

    // Enrich bookings with farmer data
    const enrichedBookings = [];
    for (const booking of bookings || []) {
      let farmerData = null;
      if (booking.farmer_id) {
        const { data: farmer } = await supabase
          .from("farmers")
          .select("*")
          .eq("id", booking.farmer_id)
          .single();
        if (farmer) {
          farmerData = FarmerModel.format(farmer);
        }
      }

      let centerData = null;
      if (booking.center_id) {
        const { data: center } = await supabase
          .from("procurement_centers")
          .select("*")
          .eq("id", booking.center_id)
          .single();
        if (center) {
          centerData = {
            id: center.id,
            name: center.center_name,
            location: center.location,
            district: center.district,
          };
        }
      }

      enrichedBookings.push({
        ...BookingModel.format(booking),
        farmer: farmerData,
        center: centerData,
      });
    }

    res.json({
      success: true,
      data: enrichedBookings,
      count: enrichedBookings.length,
      page: parseInt(page),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/bookings/:id
 * Get detailed booking info
 */
const getBookingDetail = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: booking, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    // Get farmer info
    let farmerData = null;
    if (booking.farmer_id) {
      const { data: farmer } = await supabase
        .from("farmers")
        .select("*")
        .eq("id", booking.farmer_id)
        .single();
      if (farmer) farmerData = FarmerModel.format(farmer);
    }

    // Get center info
    let centerData = null;
    if (booking.center_id) {
      const { data: center } = await supabase
        .from("procurement_centers")
        .select("*")
        .eq("id", booking.center_id)
        .single();
      if (center) {
        centerData = {
          id: center.id,
          name: center.center_name,
          location: center.location,
          district: center.district,
          phone: center.phone,
        };
      }
    }

    res.json({
      success: true,
      data: {
        ...BookingModel.format(booking),
        farmer: farmerData,
        center: centerData,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/bookings/:id/approve
 * Approve a pending booking
 */
const approveBooking = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: booking } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", id)
      .single();

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Cannot approve a booking with status: ${booking.status}`,
      });
    }

    const { data: updated, error } = await supabase
      .from("bookings")
      .update({ status: "confirmed" })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Emit real-time notification to farmer
    const socketHelpers = req.app.get("socketHelpers");
    if (socketHelpers && booking.farmer_id) {
      socketHelpers.emitBookingStatusUpdate(booking.farmer_id, {
        bookingId: id,
        status: "confirmed",
        tokenNumber: booking.token_number,
        message: "Your booking has been approved by admin!",
      });
    }

    // Create notification in DB
    await supabase.from("notifications").insert({
      farmer_id: booking.farmer_id,
      booking_id: id,
      type: "booking_approved",
      title: "Booking Approved!",
      message: `Your booking (Token: ${booking.token_number}) has been approved. Please arrive at the center on your scheduled date.`,
    });

    res.json({
      success: true,
      message: "Booking approved successfully.",
      data: BookingModel.format(updated),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/bookings/:id/reject
 * Reject a booking
 */
const rejectBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const { data: booking } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", id)
      .single();

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    if (booking.status === "completed" || booking.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: `Cannot reject a ${booking.status} booking.`,
      });
    }

    const { data: updated, error } = await supabase
      .from("bookings")
      .update({ status: "cancelled", notes: reason || "Rejected by admin" })
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

    // Emit real-time notification to farmer
    const socketHelpers = req.app.get("socketHelpers");
    if (socketHelpers && booking.farmer_id) {
      socketHelpers.emitBookingStatusUpdate(booking.farmer_id, {
        bookingId: id,
        status: "cancelled",
        tokenNumber: booking.token_number,
        message: reason || "Your booking has been rejected by admin.",
      });
    }

    // Create notification
    await supabase.from("notifications").insert({
      farmer_id: booking.farmer_id,
      booking_id: id,
      type: "booking_rejected",
      title: "Booking Rejected",
      message: `Your booking (Token: ${booking.token_number}) has been rejected. ${reason || "Please contact support."}`,
    });

    res.json({
      success: true,
      message: "Booking rejected successfully.",
      data: BookingModel.format(updated),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/bookings/:id/status
 * Update booking status (in_progress, completed, etc.)
 */
const updateBookingStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = BookingModel.VALID_STATUSES;
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const { data: booking } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", id)
      .single();

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    const updateData = { status };

    // If completing, update payment status
    if (status === "completed") {
      updateData.payment_status = "completed";
    }

    const { data: updated, error } = await supabase
      .from("bookings")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Update queue positions for center if completing/cancelling
    if (status === "completed" || status === "cancelled") {
      // Decrement positions of remaining bookings
      const { data: laterBookings } = await supabase
        .from("bookings")
        .select("id, current_position")
        .eq("center_id", booking.center_id)
        .eq("appointment_date", booking.appointment_date)
        .in("status", ["pending", "confirmed", "in_progress"])
        .gt("current_position", booking.current_position);

      if (laterBookings) {
        for (const later of laterBookings) {
          const newPosition = Math.max(1, later.current_position - 1);
          await supabase
            .from("bookings")
            .update({
              current_position: newPosition,
              estimated_wait_time: (newPosition - 1) * 15,
            })
            .eq("id", later.id);

          // Notify each farmer of position update
          const socketHelpers = req.app.get("socketHelpers");
          if (socketHelpers) {
            const { data: laterBooking } = await supabase
              .from("bookings")
              .select("farmer_id")
              .eq("id", later.id)
              .single();
            if (laterBooking) {
              socketHelpers.emitPositionUpdate(laterBooking.farmer_id, {
                bookingId: later.id,
                currentPosition: newPosition,
                estimatedWaitTime: (newPosition - 1) * 15,
              });
            }
          }
        }
      }

      // Update center queue count
      const { count: activeCount } = await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("center_id", booking.center_id)
        .in("status", ["confirmed", "in_progress"]);

      await supabase
        .from("procurement_centers")
        .update({ current_queue: activeCount || 0 })
        .eq("id", booking.center_id);
    }

    // Emit real-time notification
    const socketHelpers = req.app.get("socketHelpers");
    if (socketHelpers && booking.farmer_id) {
      const statusMessages = {
        pending: "Your booking is pending admin review.",
        confirmed: "Your booking has been approved!",
        in_progress: "Your booking is now being processed at the center.",
        completed: "Your booking has been completed. Payment will be processed.",
        cancelled: "Your booking has been cancelled.",
      };

      socketHelpers.emitBookingStatusUpdate(booking.farmer_id, {
        bookingId: id,
        status,
        tokenNumber: booking.token_number,
        message: statusMessages[status] || `Booking status updated to ${status}`,
      });
    }

    // Create notification
    await supabase.from("notifications").insert({
      farmer_id: booking.farmer_id,
      booking_id: id,
      type: `booking_${status}`,
      title: `Booking ${status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ")}`,
      message: `Your booking (Token: ${booking.token_number}) status has been updated to: ${status.replace("_", " ")}.`,
    });

    res.json({
      success: true,
      message: `Booking status updated to ${status}.`,
      data: BookingModel.format(updated),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/farmers
 * Get all registered farmers
 */
const getAllFarmers = async (req, res, next) => {
  try {
    const { data: farmers, error } = await supabase
      .from("farmers")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;

    res.json({
      success: true,
      data: (farmers || []).map(FarmerModel.format),
      count: farmers ? farmers.length : 0,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  adminLogin,
  getDashboardStats,
  getAllBookings,
  getBookingDetail,
  approveBooking,
  rejectBooking,
  updateBookingStatus,
  getAllFarmers,
};

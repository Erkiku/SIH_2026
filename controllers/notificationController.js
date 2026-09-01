const { supabase } = require("../config/db");
const NotificationModel = require("../models/Notification");

/**
 * GET /api/notifications
 * Get all notifications for the logged-in farmer
 */
const getNotifications = async (req, res, next) => {
  try {
    const farmerId = req.farmerId;
    const { unread } = req.query;

    let query = supabase
      .from(NotificationModel.tableName)
      .select("*")
      .eq("farmer_id", farmerId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (unread === "true") {
      query = query.eq("is_read", false);
    }

    const { data: notifications, error } = await query;

    if (error) throw error;

    // Count unread
    const { count: unreadCount } = await supabase
      .from(NotificationModel.tableName)
      .select("id", { count: "exact", head: true })
      .eq("farmer_id", farmerId)
      .eq("is_read", false);

    res.json({
      success: true,
      data: (notifications || []).map(NotificationModel.format),
      count: notifications ? notifications.length : 0,
      unreadCount: unreadCount || 0,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/notifications/:id
 * Mark notification as read
 */
const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const farmerId = req.farmerId;

    const { data: notification, error } = await supabase
      .from(NotificationModel.tableName)
      .update({ is_read: true })
      .eq("id", id)
      .eq("farmer_id", farmerId)
      .select()
      .single();

    if (error || !notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
    }

    res.json({
      success: true,
      message: "Notification marked as read.",
      data: NotificationModel.format(notification),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */
const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const farmerId = req.farmerId;

    const { error } = await supabase
      .from(NotificationModel.tableName)
      .delete()
      .eq("id", id)
      .eq("farmer_id", farmerId);

    if (error) throw error;

    res.json({
      success: true,
      message: "Notification deleted.",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/notifications/device
 * Register FCM device token
 */
const registerDevice = async (req, res, next) => {
  try {
    const farmerId = req.farmerId;
    const { deviceId, fcmToken } = req.body;

    if (!deviceId && !fcmToken) {
      return res.status(400).json({
        success: false,
        message: "Device ID or FCM token is required.",
      });
    }

    const { error } = await supabase
      .from("farmers")
      .update({ device_id: deviceId || fcmToken })
      .eq("id", farmerId);

    if (error) throw error;

    res.json({
      success: true,
      message: "Device registered for push notifications.",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  deleteNotification,
  registerDevice,
};

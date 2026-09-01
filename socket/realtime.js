/**
 * Socket.IO Real-time Module
 * Handles real-time queue updates and notifications
 */

const setupSocket = (io) => {
  // Connected farmers by their ID
  const connectedFarmers = new Map();

  io.on("connection", (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    /**
     * Farmer joins with their ID for targeted updates
     */
    socket.on("joinFarmer", (farmerId) => {
      if (farmerId) {
        connectedFarmers.set(farmerId, socket.id);
        socket.join(`farmer_${farmerId}`);
        console.log(`[Socket] Farmer ${farmerId} joined`);
      }
    });

    /**
     * Join a center's queue room for live updates
     */
    socket.on("joinQueue", (centerId) => {
      if (centerId) {
        socket.join(`center_${centerId}`);
        console.log(`[Socket] Client joined center queue: ${centerId}`);
      }
    });

    /**
     * Leave a center's queue room
     */
    socket.on("leaveQueue", (centerId) => {
      if (centerId) {
        socket.leave(`center_${centerId}`);
        console.log(`[Socket] Client left center queue: ${centerId}`);
      }
    });

    /**
     * Handle disconnect
     */
    socket.on("disconnect", () => {
      // Remove from connected farmers
      for (const [farmerId, socketId] of connectedFarmers.entries()) {
        if (socketId === socket.id) {
          connectedFarmers.delete(farmerId);
          break;
        }
      }
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  // Return helper functions for emitting events from controllers
  return {
    /**
     * Send queue update to all clients watching a center
     */
    emitQueueUpdate: (centerId, data) => {
      io.to(`center_${centerId}`).emit("queueUpdate", {
        centerId,
        currentQueue: data.currentQueue,
        timestamp: new Date().toISOString(),
        ...data,
      });
    },

    /**
     * Send position update to a specific farmer
     */
    emitPositionUpdate: (farmerId, data) => {
      io.to(`farmer_${farmerId}`).emit("positionUpdate", {
        bookingId: data.bookingId,
        currentPosition: data.currentPosition,
        estimatedWaitTime: data.estimatedWaitTime,
        timestamp: new Date().toISOString(),
      });
    },

    /**
     * Send notification to a specific farmer
     */
    emitNotification: (farmerId, notification) => {
      io.to(`farmer_${farmerId}`).emit("notification", {
        ...notification,
        timestamp: new Date().toISOString(),
      });
    },

    /**
     * Broadcast to all connected clients
     */
    broadcast: (event, data) => {
      io.emit(event, data);
    },

    /**
     * Get connected farmers count
     */
    getConnectedCount: () => connectedFarmers.size,
  };
};

module.exports = { setupSocket };

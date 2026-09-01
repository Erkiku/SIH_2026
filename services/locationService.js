/**
 * Location Service
 * Haversine formula for calculating distance between GPS coordinates
 * Used for finding nearby procurement centers
 */

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lng1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lng2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in kilometers

  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in km
};

/**
 * Convert degrees to radians
 */
const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

/**
 * Sort centers by distance from a given point
 * @param {Array} centers - Array of center objects with lat/lng
 * @param {number} userLat - User's latitude
 * @param {number} userLng - User's longitude
 * @param {number} maxDistanceKm - Maximum distance in km (default 50)
 * @returns {Array} Centers sorted by distance, with distance property added
 */
const sortByDistance = (centers, userLat, userLng, maxDistanceKm = 50) => {
  return centers
    .map((center) => {
      const distance = calculateDistance(
        userLat,
        userLng,
        center.lat || center.latitude,
        center.lng || center.longitude,
      );
      return { ...center, distance: Math.round(distance * 10) / 10 }; // Round to 1 decimal
    })
    .filter((center) => center.distance <= maxDistanceKm)
    .sort((a, b) => a.distance - b.distance);
};

/**
 * Check if coordinates are valid
 */
const isValidCoordinates = (lat, lng) => {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
};

module.exports = { calculateDistance, sortByDistance, isValidCoordinates };

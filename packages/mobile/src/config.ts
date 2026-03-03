/**
 * App configuration
 */

// API base URL - update this for production
// For local development with Expo, use your computer's IP address (not localhost)
// Run `ipconfig getifaddr en0` on Mac to get your IP
export const API_BASE_URL = __DEV__
  ? "http://192.168.68.74:8000/api" // Replace with your local IP
  : "https://api.leaguegenius.app/api"; // Production URL

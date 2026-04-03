/**
 * App configuration
 */

// API base URL - update this for production
// For local development with Expo, use your computer's IP address (not localhost)
// Run `ipconfig getifaddr en0` on Mac to get your IP
export const API_BASE_URL = __DEV__
  ? "http://192.168.68.50:8000/api" // Replace with your local IP
  : "https://api.leaguegenius.app/api"; // Production URL

// RevenueCat API key — set this to your Apple API key from the RevenueCat dashboard
// TODO: Replace with actual key from RevenueCat project settings
export const REVENUECAT_API_KEY = "appl_IrFIByyqstAqzaWitcjFoxmVOea";

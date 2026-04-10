/**
 * App configuration
 */

// API base URL - update this for production
// For local development with Expo, use your computer's IP address (not localhost)
// Run `ipconfig getifaddr en0` on Mac to get your IP
export const API_BASE_URL = __DEV__
  ? "http://192.168.12.121:8000/api" // Replace with your local IP
  : "https://api.leaguegenius.app/api"; // Production URL

// RevenueCat API key
// Dev (Expo Go): Test Store key — find it in RevenueCat dashboard → SDK API keys → Test Store
// Prod (dev build / TestFlight): appl_ key for League Genius (App Store)
export const REVENUECAT_API_KEY = __DEV__
  ? "test_hXLUyrjeiWHyiRGuTHndPCWrFOF"
  : "appl_IrFIByyqstAqzaWitcjFoxmVOea";

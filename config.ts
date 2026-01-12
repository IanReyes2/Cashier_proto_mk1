// config.ts
const hostname =
  typeof window !== "undefined" ? window.location.hostname : "localhost";

// Kiosk frontend/backend URL
// config.ts (cashier dashboard)
export const KIOSK_API_URL = "http://localhost:3000";
 // replace 3000 with the actual Kiosk port if different

export const API_URL = `http://${hostname}:3001`; // your own API
export const WS_URL = `ws://${hostname}:3001`;   // websocket

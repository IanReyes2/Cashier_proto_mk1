// config.ts
const hostname = typeof window !== "undefined" ? window.location.hostname : "localhost";

export const API_URL = `http://${hostname}:3001`;
export const WS_URL = `http://192.168.1.4:3001`; // localhost if testing locally


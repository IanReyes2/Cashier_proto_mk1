// config.ts
const hostname = typeof window !== "undefined" ? window.location.hostname : "localhost";

export const API_URL = `http://${hostname}:3001`;
export const WS_URL = `ws://${hostname}:3001`;

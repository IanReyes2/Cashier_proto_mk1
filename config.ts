// config.ts
const hostname = typeof window !== "undefined" ? window.location.hostname : "localhost";

export const API_URL = `http://${hostname}:3001`;
export const WS_URL = `ws://192.168.254.124:3001`; // this is the globe wifi

// export const WS_URL = `ws://192.168.1.9:3001`; this is the home wifi

// remove or add double slashes at the end of the URLs as needed

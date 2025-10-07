import axios from "axios";
export const api = axios.create({ baseURL: "/api" });

// Initialize auth header from localStorage on first load (prevents 401 after refresh)
try {
  const saved = JSON.parse(localStorage.getItem("lot_auth") || "null");
  if (saved?.token) api.defaults.headers.common["Authorization"] = `Bearer ${saved.token}`;
} catch { /* ignore */ }

export const setAuth = (token) => {
  api.defaults.headers.common["Authorization"] = token ? `Bearer ${token}` : "";
};

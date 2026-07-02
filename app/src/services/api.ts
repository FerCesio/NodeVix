import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:8080/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// 1. Interceptor de REQUEST (Para mandar el token)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token && config.headers) {
      // Usamos la sintaxis estándar de Bearer token
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 2. Interceptor de RESPONSE (Para manejar sesiones expiradas)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si el back devuelve 401 (Unauthorized), el token no sirve más
    // No actuar en rutas de auth (login/register) para no interferir con el feedback
    const url = error.config?.url || "";
    if (error.response && error.response.status === 401 && !url.includes("/auth/")) {
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
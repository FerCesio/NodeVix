import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080/api",
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


api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || "";
    
    // Identificamos si el error viene del flujo de carga de proyectos
    const isProjectFlow = url.includes("/manage/") || url.includes("/projects/");

    // Si el back devuelve 401 y NO es ni el auth ni el chequeo de proyectos, lo echamos
    if (error.response && error.response.status === 401 && !url.includes("/auth/") && !isProjectFlow) {
      console.warn("⚠️ Token inválido/expirado detectado globalmente. Expulsando usuario...");
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      window.location.href = "/login";
    }
    
    return Promise.reject(error);
  }
);
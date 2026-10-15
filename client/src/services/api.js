import axios from "axios";

const ADMIN_TOKEN_KEY = "amade_admin_token";
const STUDENT_TOKEN_KEY = "amade_student_token";

const getTokenKeyForCurrentRoute = () => {
  if (typeof window === "undefined") return null;

  const pathname = window.location.pathname || "";

  if (pathname.startsWith("/admin")) {
    return ADMIN_TOKEN_KEY;
  }

  if (pathname.startsWith("/student")) {
    return STUDENT_TOKEN_KEY;
  }

  return null;
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (
    import.meta.env.PROD
      ? "https://amade-software-0epp.onrender.com/api"
      : "http://localhost:5000/api"
  ),
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const isPublicAuthRequest = /\/auth\/(login|register)\/?$/.test(config.url || "");
  const tokenKey = isPublicAuthRequest ? null : config.authTokenKey || getTokenKeyForCurrentRoute();
  const token = tokenKey && window.sessionStorage.getItem(tokenKey);

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
    config.authTokenKey = tokenKey;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const tokenKey = error.config?.authTokenKey;
    if (error.response?.status === 401 && tokenKey) {
      window.sessionStorage.removeItem(tokenKey);
      window.dispatchEvent(new CustomEvent("amade:auth-expired", { detail: { tokenKey } }));
    }
    return Promise.reject(error);
  },
);

export const getHealth = async () => {
  const response = await api.get("/health");
  return response.data;
};

export const submitContactMessage = async (payload) => {
  try {
    const response = await api.post("/contact", payload);
    return response.data;
  } catch (error) {
    if (error.response) {
      return {
        success: false,
        message: error.response.data?.message || "Unable to submit message right now.",
      };
    }

    return {
      success: false,
      message: "Network error. Please try again later.",
    };
  }
};

export default api;

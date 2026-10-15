import axios from "axios";

const ADMIN_TOKEN_KEY = "amade_admin_token";
const STUDENT_TOKEN_KEY = "amade_student_token";
const configuredApiUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, "");
const defaultApiUrl = import.meta.env.PROD
  ? "https://amade-software-0epp.onrender.com/api"
  : "http://localhost:5000/api";
const apiBaseUrl = configuredApiUrl
  ? /\/api$/i.test(configuredApiUrl) ? configuredApiUrl : `${configuredApiUrl}/api`
  : defaultApiUrl;

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
  baseURL: apiBaseUrl,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

export const getApiErrorMessage = (error) => {
  const status = error.response?.status;
  const responseMessage = error.response?.data?.message;

  if (!error.isAxiosError) {
    return error.message || "Unable to sign in. Please try again.";
  }
  if (status === 401) {
    return responseMessage || "The email or password is incorrect.";
  }
  if (status === 404) {
    return "The API endpoint was not found. Check that VITE_API_URL points to the backend API ending in /api.";
  }
  if (status >= 500) {
    return "The backend could not complete the request. Please try again later.";
  }
  if (status) {
    return responseMessage || `The request failed with HTTP ${status}.`;
  }
  if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
    return "The backend request timed out. Please try again.";
  }

  return "Could not connect to the backend. Check that it is running and that its CORS settings allow this website.";
};

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
    return { success: false, message: getApiErrorMessage(error) };
  }
};

export default api;

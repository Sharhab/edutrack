import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://edutrack-dpui.onrender.com/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// ========================
// REQUEST INTERCEPTOR
// ========================
api.interceptors.request.use((config) => {

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : null;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ========================
// RESPONSE INTERCEPTOR
// ========================
api.interceptors.response.use(
  (res) => {
    console.log("✅ API RESPONSE:", res.data);
    return res;
  },
  (err) => {
    console.log("❌ API ERROR:", {
      message: err.message,
      response: err.response?.data,
      status: err.response?.status,
    });

    return Promise.reject(err);
  }
);

export default api;
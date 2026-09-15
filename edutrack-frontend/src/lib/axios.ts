import axios from "axios";

const api = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_URL ||
    "https://edutrack-dpui.onrender.com/api",

  // Keep this because your backend uses cookies too.
  withCredentials: true,
});

// ========================
// REQUEST INTERCEPTOR
// ========================
//
// Automatically attach the logged-in user's JWT
// to every API request.
//
// This fixes:
// GET /api/dashboard/school-admin -> 401
//
// because the backend receives:
//
// Authorization: Bearer <token>
//

api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");

      if (token) {
        config.headers = config.headers || {};

        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ========================
// RESPONSE INTERCEPTOR
// ========================

api.interceptors.response.use(
  (response) => {
    console.log("✅ API RESPONSE:", response.data);

    return response;
  },

  (error) => {
    console.log("❌ API ERROR:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      url: error.config?.url,
      method: error.config?.method,
    });

    // Don't automatically logout here.
    //
    // Some requests can legitimately return 401,
    // and automatically clearing the session can create
    // redirect loops.

    return Promise.reject(error);
  }
);

export default api;

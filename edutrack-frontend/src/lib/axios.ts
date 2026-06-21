import axios from "axios";

const api = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_URL ||
    "https://edutrack-dpui.onrender.com/api",
  withCredentials: true, // ✅ MUST KEEP
});

// ❌ REMOVE this completely:
// localStorage token interceptor (BREAKS AUTH CONSISTENCY)

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
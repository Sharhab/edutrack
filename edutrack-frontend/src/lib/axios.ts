import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:4000/api", // 🔥 HARD FIX (no env risk)
  withCredentials: true,
});

// Request log (VERY IMPORTANT)
api.interceptors.request.use((config) => {
  console.log("🚀 API REQUEST:", {
    url: config.url,
    baseURL: config.baseURL,
    full: `${config.baseURL}${config.url}`,
    data: config.data,
  });

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : null;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Response log (VERY IMPORTANT)
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

api.interceptors.request.use((config) => {
  console.log("INTERCEPTOR RUNNING");

  const token =
    localStorage.getItem("token");

  console.log("TOKEN:", token);

  if (token) {
    config.headers.Authorization =
      `Bearer ${token}`;
  }

  return config;
});

export default api;

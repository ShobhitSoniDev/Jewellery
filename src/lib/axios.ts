import axios, { AxiosError, AxiosInstance } from "axios";

let isUnauthorized = false; // ✅ global flag

const apiClient: AxiosInstance = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

/* =========================
   REQUEST INTERCEPTOR
========================= */
apiClient.interceptors.request.use(
  (config) => {

    // ✅ if 401 comes so request cancel
    if (isUnauthorized) {
      return Promise.reject("Session expired");
    }

    const token = localStorage.getItem("token");

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* =========================
   RESPONSE INTERCEPTOR
========================= */
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<any>) => {

    if (error.response?.status === 401 && !isUnauthorized) {

      isUnauthorized = true; // ✅ future API calls block

      alert("Session expired. Please login again.");

      localStorage.removeItem("token");
      sessionStorage.clear();

      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default apiClient;

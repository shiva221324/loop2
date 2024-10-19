import axios from "axios";

export const axiosInstance = axios.create({
  baseURL:
    import.meta.env.MODE === "development"
      ? "http://localhost:5000/api/v1"
      : "https://loop-backend-plum.vercel.app/api/v1",
  withCredentials: true,
});

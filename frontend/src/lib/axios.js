import axios from "axios";

export const axiosInstance = axios.create({
  baseURL:
    import.meta.env.MODE === "development"
      ? "http://34.171.99.1:5000/api/v1"
      : "http://34.171.99.1:5000/api/v1",
  withCredentials: true,
});

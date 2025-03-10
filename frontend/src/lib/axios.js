import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: "https://loop-f4pq.onrender.com/api/v1",
  withCredentials: true,
});

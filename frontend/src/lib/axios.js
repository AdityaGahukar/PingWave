import axios from "axios";

export const axiosInstance = axios.create({
    baseURL: import.meta.env.MODE === "development" ? "http://localhost:3000/api" : "/api",  // in production, the frontend and backend are served from the same origin (append /api to the current origin)
    withCredentials: true, // to send cookies with requests to handle authentication
})
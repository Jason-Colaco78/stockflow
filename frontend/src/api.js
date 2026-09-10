import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:7000/api"
});

// Normalize backend errors to a readable message.
export function apiError(error, fallback = "Something went wrong") {
    return (
        error?.response?.data?.message ||
        error?.message ||
        fallback
    );
}

export default api;

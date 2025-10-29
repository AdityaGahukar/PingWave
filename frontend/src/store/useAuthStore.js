import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

// Zustand store to manage authentication state
// create a store with initial state and actions to update the state
// set is used to update the state
export const useAuthStore = create((set) => ({
    authUser: null,
    isCheckingAuth: true,
    isSigningUp: false,

    checkAuth: async () => {
        try {
            const res = await axiosInstance.get("/auth/check");
            set({ authUser: res.data});
        } catch (error) {
            console.log("Error in authCheck:", error);
            set({ authUser: null });
        } finally {
            set({ isCheckingAuth: false });
        }
    },

    signup: async (data) => {
        set({ isSigningUp: true });
        try {
            const res = await axiosInstance.post("auth/signup", data);
            set({ authUser: res.data });

            toast.success("Account created successfully!");
        } catch(error) {
            toast.error(error.response?.data?.message || "Signup failed. Please try again.");
        } finally {
            set({ isSigningUp: false });
        }
    }
}));
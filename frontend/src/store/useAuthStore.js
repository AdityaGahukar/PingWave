import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:3000" : "/";  // base URL for socket connection (we have same origin in production)

// Zustand store to manage authentication state
// create a store with initial state and actions to update the state
// set is used to update the state
export const useAuthStore = create((set, get) => ({
    authUser: null,
    isCheckingAuth: true,
    isSigningUp: false,
    isLoggingIn: false,
    onlineUsers: [],
    socket: null,

    checkAuth: async () => {
        try {
            const res = await axiosInstance.get("/auth/check-auth");
            set({ authUser: res.data.user });
            
            get().connectSocket();  // connect socket if user is authenticated
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
            
            get().connectSocket();  // connect socket after signup
        } catch(error) {
            toast.error(error?.response?.data?.message || "Signup failed. Please try again.");
        } finally {
            set({ isSigningUp: false });
        }
    },

    login: async (data) => {
        set({ isLoggingIn: true });
        try {
            const res = await axiosInstance.post("auth/login", data);
            set({ authUser: res.data });
            toast.success("Logged in successfully");

            get().connectSocket();  // connect socket after login
        } catch (error) {
            toast.error(error?.response?.data?.message || "Login failed. Please try again.");
        } finally {
            set({ isLoggingIn: false });
        }
    },

    logout: async () => {
        try {
            await axiosInstance.post("auth/logout");
            set({ authUser: null });
            toast.success("Logged out successfully");

            get().disconnectSocket();  // disconnect socket on logout
        } catch (error) {
            toast.error(error?.response?.data?.message || "Logout failed. Please try again.");
        }
    },

    updateProfilePic: async (data) => {
        try {
            const res = await axiosInstance.put("/auth/update-profile", data);
            set({ authUser: res.data });
            toast.success("Profile updated successfully");
        } catch (error){
            console.error("Error in update profile:", error);
            const message = error.response?.data?.message || "Update profile picture failed";
            toast.error(message);
        }
    },

    connectSocket: () => {
        const {authUser} = get();

        if(!authUser || get().socket?.connected) return;  // if no user or socket already connected, do nothing

        // create socket connection if user is authenticated
        const socket = io(BASE_URL, {
            withCredentials: true     // this ensures cookies are sent with the connection
        });  

        socket.connect();  // establish the connection

        set({ socket });  // save socket in the store

        // listen for online users update (event) from server
        socket.on("getOnlineUsers", (users) => {
            set({ onlineUsers: users });
        });
    },

    disconnectSocket: () => {
        const { socket } = get();
        if (socket?.connected) {
            socket.off("getOnlineUsers");  // remove event listener
            socket.disconnect();  // disconnect the socket
            set({ socket: null });  // remove socket from the store
        }
    }
}));
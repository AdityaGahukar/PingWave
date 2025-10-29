import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";

// All the states and actions related to chat will be managed here
export const useChatStore = create((set, get) => ({
    allContacts: [],
    chats: [],  // chat partners
    messages: [],
    activeTab: "chats", // chats or all contacts
    selectedUser: null, // currently selected chat partner
    isUsersLoading: false,
    isMessagesLoading: false,
    isSoundEnabled: JSON.parse(localStorage.getItem("isSoundEnabled")) === true,

    toggleSound: () => {
        localStorage.setItem("isSoundEnabled", !get().isSoundEnabled); // update in localStorage (so that user preference persists on reload)
        set({ isSoundEnabled: !get().isSoundEnabled });  // update the state (so we can update in UI immediately)
    },

    setActiveTab: (tab) => set({ activeTab: tab }), // "chats" or "allContacts"
    setSelectedUser: (user) => set({ selectedUser: user }),  // set the currently selected chat partner

    getAllContacts: async () => {
        set({ isUsersLoading: true });
        try {
            const res = await axiosInstance.get("/messages/contacts");
            set({ allContacts: res.data });
        } catch (error) {
            toast.error(error.response.data.message);
        } finally {
            set({ isUsersLoading: false });
        }
    },

    getMyChatPartners: async () => {
        set({ isUsersLoading: true });
        try {
            const res = await axiosInstance.get("/messages/chats");
            set({ chats: res.data});
        } catch (error){
            toast.error(error.response.data.message);
        } finally {
            set({ isUsersLoading: false});
        }
    },

    
}))
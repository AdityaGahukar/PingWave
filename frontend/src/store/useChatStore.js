import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";

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
            console.log(res.data);
            set({ allContacts: res.data.users || [] });
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to load users");
            set({ allContacts: []});
        } finally {
            set({ isUsersLoading: false });
        }
    },

    getMyChatPartners: async () => {
        set({ isUsersLoading: true });
        try {
            const res = await axiosInstance.get("/messages/chats");
            set({ chats: res.data.chatPartners || [] });
        } catch (error){
            console.error("Error fetching chats:", error);
            toast.error(error?.response?.data?.message || "Failed to load chats");
            set({ chats: [] });
        } finally {
            set({ isUsersLoading: false});
        }
    },

    getMessagesByUserId: async (userId) => {
        set({isMessagesLoading: true});
        try {
            const res = await axiosInstance.get(`/messages/${userId}`);
            set({messages: res.data});
        } catch (error) {
            toast.error(error?.response?.data?.message || "Error to get messages");
        } finally {
            set({isMessagesLoading: false});
        }
    },

    sendMessage: async (messageData) => {
        const { selectedUser } = get();
        const { authUser } = useAuthStore.getState();  // access values from different store in Zustand

        const tempId = `temp-${Date.now()}`;

        const optimisticMessage = {
            _id: tempId,
            senderId: authUser._id,
            receiverId: selectedUser._id,
            text: messageData.text,
            image: messageData.image,
            createdAt: new Date().toISOString(),
            isOptimistic: true,  // flag to identify optimistic messages (optional)
        };
        // immediately update the ui by adding the message
        // set({ messages: [...messages, optimisticMessage]});
        set((state) => ({ messages: [...state.messages, optimisticMessage]}));

        try {
            const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
            // set({ messages: messages.concat(res.data.newMessage)});
            set((state) => {
                const idx = state.messages.findIndex((m) => m._id === tempId);
                if(idx === -1) return { messages: [...state.messages, res.data.newMessage] };
                const next = state.messages.slice();
                next[idx] = res.data.newMessage;
                return { messages: next};
            });
        } catch (error) {
            // remove optimistic message on failure
            // set({ messages: messages });
            set((state) => ({
                messages: state.messages.filter((m) => m._id !== tempId),
            }));
            toast.error(error?.response?.data?.message || "Something went wrong while sending message");
        } 
    },
    // Subscribe to incoming messages
    subscribeToMessages: () => {
        const { selectedUser, isSoundEnabled } = get();
        if(!selectedUser) return; // no user selected

        const socket = useAuthStore.getState().socket;

        socket.on("newMessage", (newMessage) => {
            const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser._id;
            if(!isMessageSentFromSelectedUser) return; // ignore messages not from the selected user

            const currentMessages = get().messages;
            set({ messages: [...currentMessages, newMessage] }); // append the new message

            // play notification sound if enabled
            if(isSoundEnabled){
                const notificationSound = new Audio("/sounds/notification.mp3");
                
                notificationSound.currentTime = 0;  // rewind to start
                notificationSound.play().catch((err) => {
                    console.error("Error playing notification sound: ", err);
                });
            }
        });
    },

    unsubscribeFromMessages: () => {
        const socket = useAuthStore.getState().socket;
        socket.off("newMessage");
    }
}))

/*
💡 What is an Optimistic Update?

An optimistic update means you instantly update the UI assuming the backend request will succeed — instead of waiting for the server’s response.

If the request fails later, you revert the change.

In your case:
As soon as the user clicks send, the new message appears in the chat window immediately (with a temporary _id).
Meanwhile, the API call runs in the background.
If the server responds successfully, you replace the temp message with the real one.
If it fails, you remove the temporary message and show an error.
*/
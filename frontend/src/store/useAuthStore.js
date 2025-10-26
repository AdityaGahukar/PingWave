import { create } from "zustand";

// Zustand store to manage authentication state
// create a store with initial state and actions to update the state
// set is used to update the state
export const useAuthStore = create((set) => ({
    authUser: { name: "john", _id: 123, age: 25},
    isLoggedIn: false,
    isLoading: false,

    login: () => {
        console.log("We just logged in");
        set({ isLoggedIn: true, isLoading: true });
    }
}));
// src/store.js
import { configureStore } from "@reduxjs/toolkit";
import tasksReducer from "../redux/tasksSlice.js";
import authReducer from "../redux/authSlice.js"; // Add this import

export const store = configureStore({
  reducer: {
    tasks: tasksReducer,
    auth: authReducer, // Add this line
  },
});

// 👇 Log state changes globally
store.subscribe(() => {
  console.log("Store updated:", store.getState());
});
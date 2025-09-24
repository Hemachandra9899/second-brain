// src/store.js
import { configureStore } from "@reduxjs/toolkit";
import tasksReducer from "../redux/tasksSlice.js";

export const store = configureStore({
  reducer: {
    tasks: tasksReducer,
  },
});

// 👇 Log state changes globally
store.subscribe(() => {
  console.log("Store updated:", store.getState());
});

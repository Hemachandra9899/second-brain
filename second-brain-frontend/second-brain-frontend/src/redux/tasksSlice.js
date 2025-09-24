// src/redux/taskSlice.js
import { createSlice } from "@reduxjs/toolkit";

const taskSlice = createSlice({
  name: "tasks",
  initialState: {
    list: [],
  },
  reducers: {
    addTask: (state, action) => {
      const { title, description } = action.payload;
      state.list.push({
        id: Date.now(),
        title,
        description,
      });
    },
    removeTask: (state, action) => {
      state.list = state.list.filter((task) => task.id !== action.payload);
    },
    clearTasks: (state) => {
      state.list = [];
    },
  },
});

export const { addTask, removeTask, clearTasks } = taskSlice.actions;
export default taskSlice.reducer;

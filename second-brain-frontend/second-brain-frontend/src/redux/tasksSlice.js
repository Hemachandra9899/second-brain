// src/redux/taskSlice.js
import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const taskSlice = createSlice({
  name: "tasks",
  initialState: {
    list: [],
  },
  reducers: {
    addTask: (state, action) => {
      const { title, description } = action.payload;
      const newTask = {
        title,
        description,
      };

      state.list.push(newTask);

      // 🔥 send to backend
      axios.post("http://localhost:5005/note", newTask)
        .then(() => console.log("Task saved to DB"))
        .catch((err) => console.error("Error saving task:", err));
    },

    removeTask: (state, action) => {
      const taskId = action.payload;
      state.list = state.list.filter((task) => task.id !== taskId);

      // 🔥 remove from backend
      axios.delete(`http://localhost:3000/note`)
        .then(() => console.log("Task removed from DB"))
        .catch((err) => console.error("Error removing task:", err));
    },

    clearTasks: (state) => {
      state.list = [];

      // 🔥 clear backend
      axios.delete("http://localhost:3000/note")
        .then(() => console.log("All tasks cleared from DB"))
        .catch((err) => console.error("Error clearing tasks:", err));
    },
  },
});

export const { addTask, removeTask, clearTasks } = taskSlice.actions;
export default taskSlice.reducer;

// src/redux/taskSlice.js
import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const taskSlice = createSlice({
  name: "tasks",
  initialState: {
    list: [],
  },
  reducers: {
    // ✅ Add a new task (with email from auth state)
    addTask: (state, action) => {
      const { title, description, email } = action.payload;

      const newTask = {
        title,
        description,
        email, // 👈 include email with task
      };

      state.list.push(newTask);

      // 🔥 send to backend
      axios.post("http://localhost:5006/note", newTask)
        .then(() => console.log("Task saved to DB"))
        .catch((err) => console.error("Error saving task:", err));
    },

    // ✅ Remove specific task (with email for security)
    removeTask: (state, action) => {
      const { id, email } = action.payload;
      state.list = state.list.filter((task) => task.id !== id);

      axios.delete(`http://localhost:5006/note/${id}`, {
        data: { email }, // 👈 send email to backend for validation
      })
        .then(() => console.log("Task removed from DB"))
        .catch((err) => console.error("Error removing task:", err));
    },

    // ✅ Clear all tasks for this email
    clearTasks: (state, action) => {
      const { email } = action.payload;
      state.list = [];

      axios.delete("http://localhost:5006/note", {
        data: { email }, // 👈 clear tasks only for this email
      })
        .then(() => console.log("All tasks cleared from DB"))
        .catch((err) => console.error("Error clearing tasks:", err));
    },

    // ✅ Replace Redux state with tasks fetched from DB
    setTasks: (state, action) => {
      state.list = action.payload;
    },
  },
});

export const { addTask, removeTask, clearTasks, setTasks } = taskSlice.actions;
export default taskSlice.reducer;

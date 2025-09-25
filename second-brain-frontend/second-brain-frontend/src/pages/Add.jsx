// src/components/Add.jsx
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { addTask } from "../redux/tasksSlice.js";
import { Link } from "react-router-dom";

export const Add = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const dispatch = useDispatch();

  const handleAddTask = () => {
    if (!title.trim() || !description.trim()) {
      alert("Please enter both task and description");
      return;
    }

    // Dispatch to Redux
    dispatch(addTask({ title, description }));

    // Clear inputs
    setTitle("");
    setDescription("");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100">
      <div className="bg-white shadow-2xl rounded-2xl p-8 w-full max-w-md">
        <div className="">
            <Link to="/"><button className="cursor-pointer">BACK</button></Link>
            
        </div>
        <h1 className="text-2xl font-bold text-gray-800 text-center mb-6">
          Add New Task
        </h1>

        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Enter your task..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
          />

          <textarea
            placeholder="Add some description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700 resize-none"
          />

          <button
            onClick={handleAddTask}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl shadow-md transition duration-300"
          >
            Add Task
          </button>
        </div>
      </div>
    </div>
  );
};

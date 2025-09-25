// src/components/Brain.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

export const Brain = () => {
  const reduxTasks = useSelector((state) => state.tasks.list);
  // 50 placeholders, fill from Redux tasks
  const tasks = Array.from({ length: 50 }, (_, i) => {
    const reduxTask = reduxTasks[i];
    return {
      id: i + 1,
      title: reduxTask?.title || "",
      description: reduxTask?.description || "",
      filled: !!reduxTask,
    };
  });

  return (
    <div className="brain p-6">
      <header className="mb-6 flex items-center justify-between">
        <Link to="/">
          <h2 className="text-2xl font-semibold">Brain — Task Cards</h2>
        </Link>
        <p className="text-sm text-gray-500">{tasks.length} cards</p>
      </header>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={
              `flex flex-col items-start p-4 rounded-2xl shadow-md transition ` +
              (task.filled
                ? "bg-gradient-to-br from-green-100 to-green-50 border border-green-200"
                : "bg-white border border-dashed border-gray-200")
            }
          >
            <div className="w-full flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-800">
                  {task.title || `Task #${task.id}`}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {task.description || "empty task"}
                </p>
              </div>

              <div className="text-xs px-2 py-1 rounded-full text-gray-600 border border-gray-200">
                {task.filled ? "filled" : "empty"}
              </div>
            </div>

            <div className="mt-3 w-full text-xs text-gray-400">
              <div className="h-6 rounded bg-gray-50" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

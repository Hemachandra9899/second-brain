import React from "react";
import { Link } from "react-router-dom";
import { Plus, Brain, CircleUser } from "lucide-react";

export const Header = () => {

 

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-20 bg-gradient-to-b from-purple-600 to-purple-800 text-white shadow-md flex flex-col items-center py-6 space-y-8">
          <Link to="/add">
            <Plus className="w-6 h-6" />
          </Link>

        <button
          className="p-3 rounded-xl bg-white/10 hover:bg-white/20 transition transform hover:scale-110"
          title="Brain"
        >
            <Link to="/brain"><Brain className="w-6 h-6" /></Link>
          
        </button>

        <div className="mt-auto p-3 rounded-full bg-white/20 hover:bg-white/30 transition cursor-pointer">
          <Link to="/login"><CircleUser className="w-7 h-7" /></Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center px-8 py-10 overflow-y-auto">
        {/* Header Section */}
        <header className="mb-8 text-center space-y-3">
          <h1 className="text-4xl font-extrabold tracking-tight">
            Hi there,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">
              Chandra
            </span>
          </h1>
          <h2 className="text-xl font-medium text-gray-600">
            What would you like to know?
          </h2>
          {/* <p className="text-gray-500 text-sm">
            Choose a prompt below or type your own question.
          </p> */}
        </header>

        {/* Prompt Cards in Brain-style
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 w-full max-w-6xl">
          {prompts.map((p) => (
            <button
              key={p.id}
              onClick={() => togglePrompt(p.id)}
              className={`flex flex-col items-start p-5 rounded-2xl shadow-md transition transform hover:-translate-y-0.5 text-left ${
                p.selected
                  ? "bg-gradient-to-br from-purple-100 to-pink-50 border border-purple-300"
                  : "bg-white border border-dashed border-gray-300"
              }`}
            >
              <h3 className="text-sm font-medium text-gray-800">{p.text}</h3>
              <span className="mt-3 inline-block text-xs px-2 py-1 rounded-full border">
                {p.selected ? "selected" : "click to select"}
              </span>
            </button>
          ))}
        </div> */}

        {/* Input Box */}
        <div className="w-full max-w-3xl mt-10">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 flex items-end space-x-3 hover:border-purple-300 transition">
            <textarea
              className="flex-1 resize-none outline-none text-gray-700 text-base placeholder-gray-400"
              placeholder="Ask whatever you want..."
              rows={3}
              
            />
            <button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-5 py-3 rounded-xl shadow hover:opacity-90 transition">
              →
            </button>
          </div>
          <p className="text-right text-gray-400 text-xs mt-2">0/1000</p>
        </div>
      </main>
    </div>
  );
};

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Brain, CircleUser } from "lucide-react";
import axios from "axios";
import { useSelector } from "react-redux";

export const Header = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const email = useSelector((state) => state.auth.user?.email); // optional if you want user-specific search

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    console.log("🔍 Searching for:", query);

    try {
      const res = await axios.get("http://localhost:5006/note", {
        params: { query, email },
      });

      console.log("✅ Search results:", res.data);
      setResults(res.data);
    } catch (err) {
      console.error("❌ Search error:", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

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
          <Link to="/brain">
            <Brain className="w-6 h-6" />
          </Link>
        </button>

        <div className="mt-auto p-3 rounded-full bg-white/20 hover:bg-white/30 transition cursor-pointer">
          <Link to="/login">
            <CircleUser className="w-7 h-7" />
          </Link>
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
        </header>

        {/* Input Box */}
        <div className="w-full max-w-3xl mt-10">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 flex items-end space-x-3 hover:border-purple-300 transition">
            <textarea
              className="flex-1 resize-none outline-none text-gray-700 text-base placeholder-gray-400"
              placeholder="Ask whatever you want..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              rows={3}
            />
            <button
              onClick={handleSearch}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-5 py-3 rounded-xl shadow hover:opacity-90 transition"
            >
              →
            </button>
          </div>
          <p className="text-right text-gray-400 text-xs mt-2">{query.length}/1000</p>

          {/* Loading */}
          {loading && <p className="text-gray-500 mt-3">Loading results...</p>}

          {/* Results */}
          {!loading && results.length > 0 && (
            <div className="mt-4 space-y-3 w-full">
              {results.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-white rounded-xl shadow border border-gray-200"
                >
                  <h3 className="font-semibold text-gray-800">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                  <small className="text-gray-400">Score: {item.score?.toFixed(2)}</small>
                </div>
              ))}
            </div>
          )}

          {/* No results */}
          {!loading && results.length === 0 && query.trim() !== "" && (
            <p className="text-gray-400 mt-3">No results found.</p>
          )}
        </div>
      </main>
    </div>
  );
};

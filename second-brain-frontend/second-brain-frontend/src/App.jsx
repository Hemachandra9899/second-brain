// src/App.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import { Header } from "./pages/Header.jsx";
import { Add } from "./pages/Add.jsx";
import { Brain } from "./pages/Brain.jsx";

export const App = () => {
  return (
    <div>
      {/* Header visible on all pages */}
      

      <Routes>
        <Route path="/" element={<Header />} />
        <Route path="/add" element={<Add />} />
        <Route path="/brain" element={<Brain />} />
        {/* fallback */}
        <Route path="*" element={<div className="p-6">Page Not Found</div>} />
      </Routes>
    </div>
  );
};

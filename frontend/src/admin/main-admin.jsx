import React from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "../contexts/AuthContext";
import AdminApp from "./AdminApp";
import "../index.css";

ReactDOM.createRoot(document.getElementById("admin-root")).render(
  <React.StrictMode>
    <AuthProvider>
      <AdminApp />
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: "#1f2937", color: "#f9fafb", border: "1px solid #374151" },
          success: { iconTheme: { primary: "#22c55e", secondary: "#fff" } },
          error:   { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
        }}
      />
    </AuthProvider>
  </React.StrictMode>
);

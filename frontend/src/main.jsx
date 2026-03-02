import React from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "react-hot-toast";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ""}>
      <AuthProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#ffffff",
              color: "#1a2e2c",
              border: "1px solid rgba(58,142,133,0.20)",
              boxShadow: "0 4px 16px rgba(58,142,133,0.12)",
            },
            success: { iconTheme: { primary: "#22c55e", secondary: "#fff" } },
            error:   { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
          }}
        />
      </AuthProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);

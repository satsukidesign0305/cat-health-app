import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* 認証状態をアプリ全体で共有 */}
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);

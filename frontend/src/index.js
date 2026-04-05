import React from "react";
import ReactDOM from "react-dom/client";
import "@/utils/mockAdapter"; // Mock all API calls — no backend needed
import "@/index.css";
import App from "@/App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

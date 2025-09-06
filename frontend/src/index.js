import React from "react";
import ReactDOM from "react-dom/client";
import App from './App.jsx';


// Create the root element
const root = ReactDOM.createRoot(document.getElementById("root"));

// Render App
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import HomePage from "./pages/HomePage";
import PatientPage from "./pages/PatientPage";
import NursePage from "./pages/NursePage";
import DoctorPage from "./pages/DoctorPage";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/patient" element={<PatientPage />} />
        <Route path="/nurse" element={<NursePage />} />
        <Route path="/doctor" element={<DoctorPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);

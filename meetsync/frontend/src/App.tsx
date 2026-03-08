import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";

import HomePage from "./pages/HomePage";
import DashboardPage from "./pages/DashboardPage";
import CreateEventPage from "./pages/CreateEventPage";
import EventPage from "./pages/EventPage";
import SubmittedPage from "./pages/SubmittedPage";
import NotFoundPage from "./pages/NotFoundPage";

import "./App.css";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* landing */}
          <Route path="/" element={<HomePage />} />

          {/* user dashboard */}
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* create event */}
          <Route path="/create" element={<CreateEventPage />} />

          {/* event page */}
          <Route path="/event/:id" element={<EventPage />} />

          {/* submit success */}
          <Route path="/event/:id/submitted" element={<SubmittedPage />} />

          {/* fallback */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
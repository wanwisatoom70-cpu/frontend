// File: src/App.jsx
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import API, { setUnauthorizedHandler } from "./api";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SessionExpiredModal from "./components/SessionExpiredModal";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DashboardAdmin from "./pages/DashboardAdmin";
import DashboardOwner from "./pages/DashboardOwner";
import DashboardTenant from "./pages/DashboardTenant";
import Maintenance from "./pages/Maintenance";
import Packages from "./pages/Packages";
import Profile from "./pages/profile";
import ManageUsers from "./pages/ManageUsers";
import ManageProperties from "./pages/ManageProperties";
import ManageRooms from "./pages/ManageRooms";
import OwnerProperties from "./pages/OwnerProperties";
import OwnerStaff from "./pages/OwnerStaff";
import OwnerRooms from "./pages/OwnerRooms";
import OwnerTenant from "./pages/OwnerTenant";
import PropertyDetail from "./pages/PropertyDetail";
import About from "./pages/About";
import Bookings from "./pages/Bookings";
import ActivityList from "./pages/ActivityList";
import ManagePackages from "./pages/ManagePackages";
import ManageMaintenance from "./pages/ManageMaintenance";
import Reviews from "./pages/Reviews";
import ReviewsAdmin from "./pages/ReviewsAdmin";
import RoomPrices from "./pages/RoomPrices";
import Rents from "./pages/Rents";
import ManageFurniture from "./pages/ManageFurniture";
import ManageFacilities from "./pages/ManageFacilities";

function App() {
  const [showSessionExpired, setShowSessionExpired] = useState(false);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setShowSessionExpired((prev) => {
        if (prev) return prev; // ถ้า modal กำลังแสดงอยู่แล้ว ไม่ต้อง set ซ้ำ
        return true;
      });
    });
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.__sessionExpiredShown = false;
    setShowSessionExpired(false);
    window.location.href = "/login";
  };

  return (
    <Router>
      {/* Global Session Expired Modal */}
      <SessionExpiredModal show={showSessionExpired} onConfirm={handleLogout} />
      {/* ✅ Global ToastContainer ใช้ได้ทุกหน้า */}
      <ToastContainer
        position="top-right"
        autoClose={2500}
        theme="colored"
        hideProgressBar
      />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/property/:id" element={<PropertyDetail />} />
        <Route path="/profile" element={<Profile />} />

        {/* Admin */}
        <Route path="/admin" element={<DashboardAdmin />} />
        <Route path="/admin/users" element={<ManageUsers />} />
        <Route path="/admin/properties" element={<ManageProperties />} />
        <Route path="/admin/rooms" element={<ManageRooms />} />
        <Route path="/admin/bookings" element={<Bookings />} />
        <Route path="/admin/activitylist" element={<ActivityList />} />
        <Route path="/admin/reviews" element={<ReviewsAdmin />} />

        {/* Owner */}
        <Route path="/owner" element={<DashboardOwner />} />
        <Route path="/owner/properties" element={<OwnerProperties />} />
        <Route path="/owner/rooms" element={<OwnerRooms />} />
        <Route path="/owner/staff" element={<OwnerStaff />} />
        <Route path="/owner/tenant" element={<OwnerTenant />} />
        <Route path="/owner/bookings" element={<Bookings />} />
        <Route path="/owner/packages" element={<ManagePackages />} />
        <Route path="/owner/maintenance" element={<ManageMaintenance />} />
        <Route path="/owner/reviews" element={<ReviewsAdmin />} />
        <Route path="/owner/room-prices" element={<RoomPrices />} />

        {/* Staff */}
        <Route path="/staff" element={<DashboardOwner />} />
        <Route path="/staff/rooms" element={<OwnerRooms />} />
        <Route path="/staff/tenant" element={<OwnerTenant />} />
        <Route path="/staff/bookings" element={<Bookings />} />
        <Route path="/staff/packages" element={<ManagePackages />} />
        <Route path="/staff/maintenance" element={<ManageMaintenance />} />
        <Route path="/staff/reviews" element={<ReviewsAdmin />} />
        <Route path="/staff/room-prices" element={<RoomPrices />} />
        <Route path="/staff/furniture" element={<ManageFurniture />} />
        <Route path="/staff/facilities" element={<ManageFacilities />} />

        {/* Tenant */}
        <Route path="/tenant" element={<DashboardTenant />} />
        <Route path="/tenant/maintenance" element={<Maintenance />} />
        <Route path="/tenant/packages" element={<Packages />} />
        <Route path="/tenant/reviews" element={<Reviews />} />
        <Route path="/tenant/rents" element={<Rents />} />

        {/* Guest */}
        <Route path="/home" element={<Home />} />
        <Route path="/guest/about" element={<About />} />
      </Routes>
    </Router>
  );
}

export default App;

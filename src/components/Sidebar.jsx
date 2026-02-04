// File: src/components/Sidebar.jsx
import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import API from "../api";

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const token = localStorage.getItem("token") || null;
  const userRole = token ? localStorage.getItem("role") : "visitor";
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    localStorage.removeItem("fullname");
    localStorage.removeItem("username");
    localStorage.removeItem("profile_image");
    navigate("/login");
  };
  // state สำหรับเก็บข้อมูล user
  const [user, setUser] = useState(null);
  // กำหนดสีสำหรับแต่ละหน้าที่ active
  const activeColors = {
    // Admin
    "/admin": "bg-red-50 text-red-600 border-l-4 border-red-600",
    "/admin/properties": "bg-pink-50 text-pink-600 border-l-4 border-pink-600",
    "/admin/users": "bg-purple-50 text-purple-600 border-l-4 border-purple-600",
    "/admin/rooms": "bg-orange-50 text-orange-600 border-l-4 border-orange-600",
    "/admin/bookings": "bg-Brown-50 text-red-600 border-l-4 border-red-600",
    "/admin/activitylist":
      "bg-gray-50 text-teal-600 border-l-4 border-teal-600",
    "/admin/reviews":
      "bg-yellow-50 text-yellow-600 border-l-4 border-yellow-600",

    // Owner
    "/owner": "bg-red-50 text-red-600 border-l-4 border-red-600",
    "/owner/properties": "bg-pink-50 text-pink-600 border-l-4 border-pink-600",
    "/owner/rooms": "bg-orange-50 text-orange-600 border-l-4 border-orange-600",
    "/owner/staff": "bg-purple-50 text-purple-600 border-l-4 border-purple-600",
    "/owner/tenant": "bg-teal-50 text-teal-600 border-l-4 border-teal-600",
    // "/owner/bookings": "bg-red-50 text-red-600 border-l-4 border-red-600",
    "/owner/room-prices":
      "bg-indigo-50 text-indigo-600 border-l-4 border-indigo-600",
    "/owner/packages": "bg-lime-50 text-lime-600 border-l-4 border-lime-600",
    "/owner/maintenance":
      "bg-green-50 text-green-600 border-l-4 border-green-600",
    "/owner/reviews":
      "bg-yellow-50 text-yellow-600 border-l-4 border-yellow-600",

    // Staff
    "/staff": "bg-red-50 text-red-600 border-l-4 border-red-600",
    "/staff/rooms": "bg-orange-50 text-orange-600 border-l-4 border-orange-600",
    "/staff/tenant": "bg-teal-50 text-teal-600 border-l-4 border-teal-600",
    // "/staff/bookings": "bg-red-50 text-red-600 border-l-4 border-red-600",
    "/staff/room-prices":
      "bg-indigo-50 text-indigo-600 border-l-4 border-indigo-600",
    "/staff/packages": "bg-lime-50 text-lime-600 border-l-4 border-lime-600",
    "/staff/maintenance":
      "bg-green-50 text-green-600 border-l-4 border-green-600",
    "/staff/furniture":
      "bg-purple-50 text-purple-600 border-l-4 border-purple-600",
    "/staff/facilities": "bg-blue-50 text-blue-600 border-l-4 border-blue-600",
    "/staff/reviews":
      "bg-yellow-50 text-yellow-600 border-l-4 border-yellow-600",

    // Tenant
    "/tenant": "bg-red-50 text-red-600 border-l-4 border-red-600",
    "/tenant/maintenance":
      "bg-green-50 text-green-600 border-l-4 border-green-600",
    "/tenant/packages": "bg-lime-50 text-lime-600 border-l-4 border-lime-600",
    "/tenant/rents":
      "bg-indigo-50 text-indigo-600 border-l-4 border-indigo-600",
    "/tenant/reviews":
      "bg-yellow-50 text-yellow-600 border-l-4 border-yellow-600",

    // Guest / Visitor
    "/": "bg-indigo-50 text-indigo-600 border-l-4 border-indigo-600",
    "/about": "bg-gray-50 text-gray-600 border-l-4 border-gray-600",
  };

  // สำหรับไอคอน
  const iconColors = {
    // Admin
    "/admin": "text-red-600",
    "/admin/properties": "text-pink-600",
    "/admin/users": "text-purple-600",
    "/admin/rooms": "text-orange-600",
    "/admin/bookings": "text-red-600",
    "/admin/activitylist": "text-teal-600",
    "/admin/reviews": "text-yellow-600",

    // Owner
    "/owner": "text-red-600",
    "/owner/properties": "text-pink-600",
    "/owner/rooms": "text-orange-600",
    "/owner/staff": "text-purple-600",
    "/owner/tenant": "text-teal-600",
    // "/owner/bookings": "text-red-600",
    "/owner/room-prices": "text-indigo-600",
    "/owner/packages": "text-lime-600",
    "/owner/maintenance": "text-green-600",
    "/owner/reviews": "text-yellow-600",

    // Staff
    "/staff": "text-red-600",
    "/staff/rooms": "text-orange-600",
    "/staff/tenant": "text-teal-600",
    // "/staff/bookings": "text-red-600",
    "/staff/room-prices": "text-indigo-600",
    "/staff/packages": "text-lime-600",
    "/staff/maintenance": "text-green-600",
    "/staff/furniture": "text-purple-600",
    "/staff/facilities": "text-blue-600",
    "/staff/reviews": "text-yellow-600",

    // Tenant
    "/tenant": "text-red-600",
    "/tenant/maintenance": "text-green-600",
    "/tenant/packages": "text-lime-600",
    "/tenant/rents": "text-indigo-600",
    "/tenant/reviews": "text-yellow-600",

    // Guest / Visitor
    "/": "text-indigo-600",
    "/about": "text-gray-600",
  };

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) return;

      try {
        const res = await API.get("/auth/me"); // interceptor จะ handle refresh token
        setUser(res.data);

        localStorage.setItem("fullname", res.data.fullname);
        localStorage.setItem("username", res.data.username);
        localStorage.setItem("profile_image", res.data.profile_image || "");
      } catch (err) {
        console.error("Fetch user failed:", err);

        // ถ้า refresh token หมดอายุ -> logout
        localStorage.clear();
        window.location.href = "/login";
      }
    };

    fetchUser();
  }, [token]);

  // ใช้ชื่อผู้ใช้จาก API
  const displayName = user?.fullname || user?.username || "Stayflow";
  const userProfileImage = user?.profile_image;

  const links = {
    admin: [
      { to: "/admin", label: "แดชบอร์ด", icon: "fas fa-tachometer-alt" },
      {
        to: "/admin/properties",
        label: "จัดการอสังหาริมทรัพย์",
        icon: "fas fa-building",
      },
      { to: "/admin/users", label: "จัดการผู้ใช้", icon: "fas fa-users" },
      { to: "/admin/rooms", label: "จัดการห้อง", icon: "fas fa-door-open" },
      {
        to: "/admin/bookings",
        label: "รายการเช่า",
        icon: "fas fa-calendar-check",
      },
      {
        to: "/admin/activitylist",
        label: "ประวัติในระบบ",
        icon: "fas fa-history",
      },
      { to: "/admin/reviews", label: "รีวิว", icon: "fas fa-star" },
    ],
    owner: [
      { to: "/owner", label: "แดชบอร์ด", icon: "fas fa-tachometer-alt" },
      {
        to: "/owner/properties",
        label: "จัดการอสังหาริมทรัพย์",
        icon: "fas fa-building",
      },
      { to: "/owner/rooms", label: "จัดการห้อง", icon: "fas fa-door-open" },
      { to: "/owner/staff", label: "จัดการพนักงาน", icon: "fas fa-user-tie" },
      {
        to: "/owner/tenant",
        label: "จัดการผู้เช่า",
        icon: "fas fa-user-friends",
      },
      {
        to: "/owner/room-prices",
        label: "จัดการค่าเช่า",
        icon: "fas fa-dollar-sign",
      },
      // {
      //   to: "/owner/bookings",
      //   label: "รายการเช่า",
      //   icon: "fas fa-calendar-check",
      // },
      // { to: "/owner/packages", label: "รายการพัสดุ", icon: "fas fa-box-open" },
      // { to: "/owner/maintenance", label: "รายการซ่อม", icon: "fas fa-tools" },
      { to: "/owner/reviews", label: "รีวิว", icon: "fas fa-star" },
    ],
    staff: [
      { to: "/staff", label: "แดชบอร์ด", icon: "fas fa-tachometer-alt" },
      { to: "/staff/rooms", label: "จัดการห้อง", icon: "fas fa-door-open" },
      {
        to: "/staff/tenant",
        label: "จัดการผู้เช่า",
        icon: "fas fa-user-friends",
      },
      // {
      //   to: "/staff/bookings",
      //   label: "รายการเช่า",
      //   icon: "fas fa-calendar-check",
      // },
      {
        to: "/owner/room-prices",
        label: "จัดการค่าเช่า",
        icon: "fas fa-dollar-sign",
      },
      { to: "/staff/packages", label: "รายการพัสดุ", icon: "fas fa-box-open" },
      { to: "/staff/maintenance", label: "รายการซ่อม", icon: "fas fa-tools" },
      {
        to: "/staff/furniture",
        label: "จัดการเฟอร์นิเจอร์",
        icon: "fas fa-warehouse",
      },
      {
        to: "/staff/facilities",
        label: "จัดการสิ่งอำนวยความสะดวก",
        icon: "fas fa-concierge-bell",
      },
      { to: "/staff/reviews", label: "รีวิว", icon: "fas fa-star" },
    ],
    tenant: [
      { to: "/tenant", label: "แดชบอร์ด", icon: "fas fa-tachometer-alt" },
      { to: "/tenant/maintenance", label: "แจ้งซ่อม", icon: "fas fa-tools" },
      { to: "/tenant/packages", label: "พัสดุ", icon: "fas fa-box" },
      { to: "/tenant/rents", label: "ค่าเช่า", icon: "fas fa-receipt" },
      { to: "/tenant/reviews", label: "รีวิว", icon: "fas fa-star" },
    ],
    guest: [
      { to: "/home", label: "หน้าแรก", icon: "fas fa-home" },
      { to: "/guest/about", label: "เกี่ยวกับ", icon: "fas fa-info-circle" },
    ],
    visitor: [
      { to: "/login", label: "เข้าสู่ระบบ", icon: "fas fa-sign-in-alt mr-1" },
      // { to: "/register", label: "สมัครสมาชิก", icon: "fas fa-user-plus mr-1" },
    ],
  };

  const visibleLinks = links[userRole]?.filter((link) => {
    if (token && (link.to === "/register" || link.to === "/login")) {
      return false;
    }
    return true;
  });

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        className="fixed top-4 left-4 z-50 bg-primary text-white p-2 rounded-md md:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        <i className="fas fa-bars"></i>
      </button>

      {/* Overlay สำหรับ mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
      <aside
        className={`fixed md:static inset-y-0 left-0 transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 transition-transform duration-300 ease-in-out w-64 bg-white shadow-xl rounded-r-2xl overflow-hidden flex flex-col h-full z-40`}
      >
        <div className="p-4 bg-gradient-to-r from-primary to-accent">
          {userRole === "guest" ? (
            <span className="text-white px-3 py-2 rounded-md text-sm font-medium">
              Stayflow
            </span>
          ) : (
            <>
              <Link
                to="/"
                className="text-white hover:text-indigo-200 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 hover:bg-white hover:bg-opacity-10"
              >
                <i className="fas fa-home mr-1"></i> หน้าแรก
              </Link>
              <Link
                to="/about"
                className="text-white hover:text-indigo-200 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 hover:bg-white hover:bg-opacity-10"
              >
                <i className="fas fa-info-circle mr-1"></i> เกี่ยวกับ
              </Link>
            </>
          )}
        </div>

        <nav className="mt-5 px-2 flex-1 overflow-y-auto custom-scrollbar">
          <ul className="space-y-1">
            {visibleLinks?.map((link) => {
              const isActive = location.pathname === link.to;
              const activeClass = isActive
                ? activeColors[link.to] ||
                  "bg-indigo-50 text-primary border-l-4 border-primary"
                : "text-gray-700 hover:bg-indigo-50 hover:text-primary";
              const iconClass = isActive
                ? iconColors[link.to] || "text-primary"
                : "text-gray-500 group-hover:text-primary";

              return (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    onClick={() => setIsOpen(false)}
                    className={`group flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-300 ${activeClass}`}
                  >
                    <i className={`${link.icon} mr-3 text-lg ${iconClass}`}></i>
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div
          className={`p-4 border-t border-gray-200 relative group ${
            ["admin", "owner", "staff", "tenant", "guest"].includes(userRole)
              ? "cursor-pointer"
              : "cursor-default pointer-events-none"
          }`}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {userProfileImage ? (
                (() => {
                  let srcImage = "";

                  if (
                    userProfileImage.startsWith("http") ||
                    userProfileImage.startsWith("https")
                  ) {
                    srcImage = userProfileImage;
                  } else if (userProfileImage.startsWith("/uploads")) {
                    srcImage = `http://localhost:5000${userProfileImage}`;
                  } else {
                    srcImage = "/default-avatar.png";
                  }

                  return (
                    <img
                      src={srcImage}
                      alt={displayName}
                      className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-md"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/default-avatar.png";
                      }}
                    />
                  );
                })()
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center">
                  <i className="fas fa-user text-white"></i>
                </div>
              )}
            </div>

            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">
                {userRole === "admin" && "ผู้ดูแลระบบ"}
                {userRole === "owner" && "เจ้าของหอพัก"}
                {userRole === "staff" && "พนักงาน"}
                {userRole === "tenant" && "ผู้เช่า"}
                {userRole === "guest" && "สมาชิก"}
                {userRole === "visitor" && "ผู้เยี่ยมชม"}
              </p>
              <p
                className="text-xs text-gray-500 truncate max-w-[120px]"
                title={displayName}
              >
                {displayName}
              </p>
            </div>
            {["admin", "owner", "staff", "tenant", "guest"].includes(
              userRole
            ) && (
              <i className="fas fa-chevron-up ml-auto text-gray-500 text-xs group-hover:text-primary transition" />
            )}
          </div>

          {/* Dropdown */}
          {["admin", "owner", "staff", "tenant", "guest"].includes(
            userRole
          ) && (
            <div className="absolute bottom-14 left-4 w-40 rounded-md shadow-lg py-1 bg-white bg-opacity-95 ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-bottom-left">
              <Link
                to="/profile"
                className="block px-4 py-2 text-sm text-gray-800 hover:bg-indigo-50"
              >
                <i className="fas fa-id-card mr-2"></i> โปรไฟล์
              </Link>
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <i className="fas fa-sign-out-alt mr-2"></i> ออกจากระบบ
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

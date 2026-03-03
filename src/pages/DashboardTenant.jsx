// =========================
// File: src/pages/DashboardTenant.jsx
import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import API from "../api";
import { Link } from "react-router-dom";

const DashboardTenant = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const res = await API.get("/bookings/tenant/my");
        setBookings(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  // Enhanced status badge with modern styling
  const getStatusBadge = (status) => {
    switch (status) {
      case "confirmed":
        return {
          text: "ยืนยันแล้ว",
          icon: "fas fa-check-circle text-emerald-500",
          bgColor: "bg-emerald-100",
          textColor: "text-emerald-800",
          borderColor: "border-emerald-200",
        };
      default:
        return {
          text: status,
          bgColor: "bg-gray-100",
          textColor: "text-gray-800",
          borderColor: "border-gray-200",
        };
    }
  };

  return (
    <Layout role="tenant" showFooter={false} showNav={false}>
      {/* Dynamic Background with Animated Elements */}
      <div className="relative bg-gradient-to-br from-purple-50 via-indigo-50 to-pink-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
            <i className="fas fa-calendar-check text-indigo-500 mr-3"></i>
            การเช่าของฉัน
          </h1>
          {/* Main Content Area with Glassmorphism Effect */}
          <div className="relative z-10 max-w-7xl mx-auto mt-8">
            {loading ? (
              // Modern Loading Skeleton with Animation
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(4)].map((_, index) => (
                  <div
                    key={index}
                    className="bg-red/150 backdrop-blur-sm rounded-3xl shadow-xl p-6 animate-pulse"
                  >
                    <div className="h-6 w-3/4 bg-gray-200 rounded mb-4"></div>
                    <div className="h-4 w-1/2 bg-gray-200 rounded mb-6"></div>
                    <div className="space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center">
                          <div className="h-4 w-4 bg-gray-200 rounded-full mr-3"></div>
                          <div className="h-4 w-full bg-gray-200 rounded"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : bookings.length === 0 ? (
              // Engaging Empty State with Call to Action
              <div className="flex flex-col items-center justify-center py-16 bg-red/70 backdrop-blur-sm rounded-3xl shadow-xl p-8">
                <div className="text-6xl mb-6 text-purple-500 animate-bounce">
                  <i className="fas fa-door-open"></i>
                </div>
                <h3 className="text-2xl font-bold font-kanit mb-4 text-gray-800">
                  ยังไม่มีการจองห้อง
                </h3>
                <p className="text-gray-600 mb-8 max-w-md text-center opacity-90">
                  คุณยังไม่ได้จองห้องพักใดๆ เริ่มต้นโดยการค้นหาห้องพักที่คุณสนใจ
                </p>
                <button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-full font-semibold hover:scale-105 transform transition-all duration-300 shadow-lg flex items-center">
                  <i className="fas fa-search mr-3"></i> ค้นหาห้องพัก
                </button>
              </div>
            ) : (
              // Modern Booking Cards with Hover Effects
              <div className="space-y-6">
                {bookings.map((b) => {
                  const statusBadge = getStatusBadge(b.booking_status);

                  return (
                    <div
                      key={b.booking_id}
                      className="bg-red/120 backdrop-blur-sm rounded-3xl shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
                    >
                      {/* Property Info Section with Modern Styling */}
                      <div className="p-6 border-b border-gray-100/50">
                        <div className="flex justify-between items-start">
                          <div>
                            <h2 className="text-xl font-bold font-kanit text-gray-800 mb-2">
                              {b.property_name}
                            </h2>
                            <p className="text-gray-600 text-sm flex items-center">
                              <i className="fas fa-map-marker-alt mr-2 text-purple-500"></i>
                              {b.property_address}
                            </p>
                          </div>
                          <div className="flex items-center">
                            <div
                              className={`px-4 py-2 rounded-full text-sm font-medium flex items-center border ${statusBadge.borderColor}`}
                            >
                              <i className={`${statusBadge.icon} mr-2`}></i>
                              {statusBadge.text}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Room Details Section with Grid Layout */}
                      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Room Info Column with Icon Card */}
                        <div className="md:col-span-1">
                          <h3 className="text-lg font-bold font-kanit mb-4 flex items-center text-purple-600">
                            <i className="fas fa-door-open mr-2"></i>{" "}
                            ข้อมูลห้องพัก
                          </h3>
                          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-4 border border-purple-100">
                            <div className="flex items-center mb-4">
                              <div className="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center mr-4">
                                <i className="fas fa-home text-purple-500 text-xl"></i>
                              </div>
                              <div>
                                <p className="font-semibold text-gray-800">
                                  {b.room_name}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {b.room_code}
                                </p>
                              </div>
                            </div>
                            <div className="pt-4 border-t border-purple-100/50 space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600">
                                  ประเภทการเช่าราย
                                  {b.billing_cycle === "monthly"
                                    ? "เดือน"
                                    : "เทอม"}
                                </span>
                                <span className="font-bold text-blue-600">
                                  ฿{b.price.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Amenities Column with Colorful Icons */}
                        <div className="md:col-span-1">
                          <h3 className="text-lg font-bold font-kanit mb-4 flex items-center text-purple-600">
                            <i className="fas fa-cogs mr-2"></i> ประเภทห้อง
                          </h3>
                          <div className="space-y-3">
                            {parseInt(b.has_ac) === 1 && (
                              <div className="flex items-center">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                                  <i className="fas fa-snowflake text-blue-500"></i>
                                </div>
                                <span className="text-gray-700">แอร์</span>
                              </div>
                            )}
                            {parseInt(b.has_fan) === 1 && (
                              <div className="flex items-center">
                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                                  <i className="fas fa-fan text-green-500"></i>
                                </div>
                                <span className="text-gray-700">พัดลม</span>
                              </div>
                            )}
                            {!b.has_ac && !b.has_fan && (
                              <div className="text-gray-500 italic">
                                ไม่มีสิ่งอำนวยความสะดวกพิเศษ
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Rental Period Column with Calendar Visualization */}
                        <div className="md:col-span-1">
                          <h3 className="text-lg font-bold font-kanit mb-4 flex items-center text-purple-600">
                            <i className="fas fa-calendar-alt mr-2"></i>{" "}
                            ช่วงเวลาการเช่า
                          </h3>
                          <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-4 border border-orange-100">
                            <div className="text-center mb-4">
                              <p className="font-medium">
                                {new Date(b.start_date).toLocaleDateString(
                                  "th-TH",
                                  {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  }
                                )}
                              </p>
                              <div className="my-2">
                                <i className="fas fa-exchange-alt text-gray-400"></i>
                              </div>
                              <p className="font-medium">
                                {new Date(b.end_date).toLocaleDateString(
                                  "th-TH",
                                  {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  }
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons Row with Modern Button Styles */}
                      <div className="p-6 border-t border-gray-100/50 flex justify-end space-x-4">
                        <Link
                          to={"/tenant/maintenance"}
                          className="text-sm text-purple-600 hover:text-purple-800 font-medium flex items-center px-5 py-3 border border-purple-200 rounded-full transition-all duration-300 hover:bg-purple-50"
                        >
                          <i className="fas fa-tools mr-2"></i> แจ้งซ่อม
                        </Link>
                        <Link
                          to={"/tenant/packages"}
                          className="text-sm text-green-600 hover:text-green-800 font-medium flex items-center px-5 py-3 border border-green-200 rounded-full transition-all duration-300 hover:bg-green-50"
                        >
                          <i className="fas fa-box-open mr-2"></i> ดูพัสดุ
                        </Link>
                        <Link
                          to="/tenant/rents"
                          className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center px-5 py-3 border border-indigo-200 rounded-full transition-all duration-300 hover:bg-indigo-50"
                        >
                          <i className="fas fa-receipt mr-2"></i> ดูบิล
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DashboardTenant;

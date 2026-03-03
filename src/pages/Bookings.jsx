// File: src/pages/Booking.jsx
import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import API from "../api";

const Booking = () => {
  const [role, setRole] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    const storedRole = localStorage.getItem("role");
    setRole(storedRole);
  }, []);

  useEffect(() => {
    if (!role) return;

    const fetchBookings = async () => {
      try {
        setLoading(true);
        let res = null;

        if (role === "admin") {
          res = await API.get("/bookings");
        } else if (role === "owner" || role === "staff") {
          res = await API.get("/bookings/my");
        } else {
          console.warn("Unknown role:", role);
        }

        if (res && res.data) {
          setBookings(res.data);
        } else {
          setBookings([]);
        }
      } catch (err) {
        console.error(err);
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [role]);

  // ฟังก์ชันสำหรับแปลงสถานะเป็นภาษาไทย
  const getStatusText = (status) => {
    switch (status) {
      case "pending":
        return "รอดำเนินการ";
      case "confirmed":
        return "ยืนยันแล้ว";
      case "cancelled":
        return "ยกเลิกแล้ว";
      default:
        return status;
    }
  };

  // ฟังก์ชันสำหรับแปลงสถานะเป็นสี
  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // ฟังก์ชันสำหรับแปลงรอบเรียกเก็บเงินเป็นภาษาไทย
  const getBillingCycleText = (cycle) => {
    switch (cycle) {
      case "monthly":
        return "รายเดือน";
      case "term":
        return "รายเทอม";
      default:
        return cycle;
    }
  };
  const openModal = (booking) => {
    setSelectedBooking(booking);
    setModalOpen(true);
  };

  const closeModal = () => {
    setSelectedBooking(null);
    setModalOpen(false);
  };

  // กรองข้อมูลการเช่า
  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.room_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.room_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.property_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.username?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === "all" || booking.booking_status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <Layout role={role} showFooter={false} showNav={false}>
      {/* Sticky Header with Gradient Background */}
      <div className="sticky top-0 z-10 bg-red-400 text-white shadow-lg pb-4 pt-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-4">
            <h1 className="text-2xl md:text-3xl font-bold font-kanit mb-1">
              {role === "tenant" ? "รายการเช่าของฉัน" : "รายการเช่าทั้งหมด"}
            </h1>
            <p className="text-indigo-100 text-sm">
              {role === "tenant"
                ? "ดูข้อมูลการเช่าห้องพักของคุณทั้งหมด"
                : "จัดการการเช่าห้องพักในระบบ"}
            </p>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="ค้นหาห้องพัก, ผู้เช่า..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border-0 text-gray-800 focus:ring-2 focus:ring-white focus:ring-opacity-50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute left-3 top-2.5 text-white text-opacity-70">
                <i className="fas fa-search"></i>
              </div>
            </div>
            <div className="w-full md:w-64">
              <select
                className="w-full p-2 border-0 rounded-lg text-gray-800 focus:ring-2 focus:ring-white focus:ring-opacity-50"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">ทุกสถานะ</option>
                <option value="pending">รอดำเนินการ</option>
                <option value="confirmed">ยืนยันแล้ว</option>
                <option value="cancelled">ยกเลิกแล้ว</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-h-[calc(94vh-120px)] overflow-y-auto bg-red-50 p-4 md:p-6">
        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-lg p-6 animate-pulse"
              >
                <div className="h-6 w-3/4 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 w-full bg-gray-200 rounded mb-2"></div>
                <div className="h-4 w-5/6 bg-gray-200 rounded mb-4"></div>
                <div className="h-10 w-32 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-calendar-times text-indigo-500 text-4xl"></i>
            </div>
            <h3 className="text-xl font-bold font-kanit mb-2">
              ไม่มีรายการเช่า
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filterStatus !== "all"
                ? "ไม่พบรายการเช่าที่ค้นหา"
                : role === "tenant"
                ? "คุณยังไม่มีรายการเช่าห้องพัก"
                : "ยังไม่มีรายการเช่าในระบบ"}
            </p>
            {role === "tenant" && !searchTerm && filterStatus === "all" && (
              <button className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-full font-medium hover:shadow-lg transition-all duration-300">
                ค้นหาห้องพัก
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBookings.map((booking, index) => (
              <div
                key={booking.booking_id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold font-kanit text-gray-800">
                        {booking.room_name || `ห้อง ${booking.room_code}`}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        ผู้เช่า: {booking.fullname || booking.username}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        booking.booking_status
                      )}`}
                    >
                      {getStatusText(booking.booking_status)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-gray-500">
                      {/* รหัสเช่า: #{booking.booking_id} */}
                      ลำดับ: #{index + 1}
                    </div>
                    <button
                      className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                      onClick={() => openModal(booking)}
                    >
                      ดูรายละเอียด <i className="fas fa-arrow-right ml-1"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {modalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-indigo-100 max-w-2xl w-full px-8 py-6 relative transition-all duration-300">
            {/* Close Button */}
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-indigo-600 transition-transform hover:scale-125"
              onClick={closeModal}
              aria-label="ปิด"
            >
              <i className="fas fa-times text-2xl"></i>
            </button>

            {/* Header */}
            <div className="flex items-center mb-8">
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-200 to-purple-200 flex items-center justify-center mr-5 shadow-lg ring-2 ring-indigo-300">
                <i className="fas fa-receipt text-indigo-700 text-2xl"></i>
              </div>
              <h2 className="text-3xl font-bold font-inter text-indigo-800 tracking-wide drop-shadow">
                รายละเอียดการเช่า 
                {/* #{selectedBooking.booking_id} */}
              </h2>
            </div>

            {/* Booking Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                {[
                  {
                    icon: "fa-bed",
                    bg: "bg-blue-100",
                    label: "ห้องพัก",
                    value:
                      selectedBooking.room_name || selectedBooking.room_code,
                  },
                  {
                    icon: "fa-user",
                    bg: "bg-green-100",
                    label: "ผู้เช่า",
                    value: selectedBooking.fullname || selectedBooking.username,
                  },
                  {
                    icon: "fa-building",
                    bg: "bg-purple-100",
                    label: "หอพัก",
                    value: selectedBooking.property_name || "ไม่ระบุ",
                  },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-4 group"
                  >
                    <div
                      className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center shadow group-hover:scale-110 transition ring-1 ring-indigo-200`}
                    >
                      <i
                        className={`fas ${item.icon} text-xl text-indigo-700`}
                      ></i>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">
                        {item.label}
                      </span>
                      <p className="font-semibold text-gray-700 text-lg">
                        {item.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {[
                  {
                    icon: "fa-calendar-alt",
                    bg: "bg-yellow-100",
                    label: "วันที่เช่า",
                    value: selectedBooking.booking_created_at
                      ? new Date(
                          selectedBooking.booking_created_at
                        ).toLocaleDateString("th-TH")
                      : "ไม่ระบุ",
                  },
                  {
                    icon: "fa-sign-in-alt",
                    bg: "bg-cyan-100",
                    label: "วันที่เริ่มต้น",
                    value: selectedBooking.start_date
                      ? new Date(selectedBooking.start_date).toLocaleDateString(
                          "th-TH"
                        )
                      : "ไม่ระบุ",
                  },
                  {
                    icon: "fa-sign-out-alt",
                    bg: "bg-red-100",
                    label: "วันที่สิ้นสุด",
                    value: selectedBooking.end_date
                      ? new Date(selectedBooking.end_date).toLocaleDateString(
                          "th-TH"
                        )
                      : "ไม่ระบุ",
                  },
                  {
                    icon: "fa-dollar-sign",
                    bg: "bg-orange-100",
                    label: "ราคา",
                    value: (() => {
                      const price =
                        selectedBooking.billing_cycle === "monthly"
                          ? selectedBooking.price_monthly
                          : selectedBooking.price_term;
                      return price != null
                        ? `฿${Number(price).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}/${getBillingCycleText(
                            selectedBooking.billing_cycle
                          )}`
                        : "ไม่ระบุ";
                    })(),
                  },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-4 group"
                  >
                    <div
                      className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center shadow group-hover:scale-110 transition ring-1 ring-indigo-200`}
                    >
                      <i
                        className={`fas ${item.icon} text-xl text-indigo-700`}
                      ></i>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">
                        {item.label}
                      </span>
                      <p className="font-semibold text-gray-700 text-lg">
                        {item.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 pt-6 border-t border-gray-200">
              {[
                {
                  icon: "fa-key",
                  bg: "bg-indigo-100",
                  label: "Stayflow ID",
                  value: selectedBooking.room_code,
                },
                {
                  icon: "fa-tag",
                  bg: "bg-teal-100",
                  label: "สถานะ",
                  value: getStatusText(selectedBooking.booking_status),
                },
              ].map((item, index) => (
                <div key={index} className="flex items-center space-x-4 group">
                  <div
                    className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center shadow group-hover:scale-110 transition ring-1 ring-indigo-200`}
                  >
                    <i
                      className={`fas ${item.icon} text-xl text-indigo-700`}
                    ></i>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">{item.label}</span>
                    <p className="font-semibold text-gray-700 text-lg">
                      {item.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Booking;

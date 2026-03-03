// File: src/pages/PropertyDetail.jsx
import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import API from "../api";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const PropertyDetail = () => {
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedRoomImages, setSelectedRoomImages] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const propertyId = location.state?.propertyId;
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [billingCycle, setBillingCycle] = useState("");
  const [moveInDate, setMoveInDate] = useState("");
  const [moveOutDate, setMoveOutDate] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await API.get(`/properties/${propertyId}`);
        setProperty(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [propertyId]);
  const handleBookRoom = (room) => {
    setSelectedRoom(room);
    setShowConfirmModal(true);
  };

  const handleConfirmBooking = async () => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (!token || !userId) {
      toast.info("กรุณาเข้าสู่ระบบก่อนทำการจอง");
      navigate("/login");
      return;
    }

    if (!billingCycle || !moveInDate || !moveOutDate) {
      toast.error("❌ กรุณากรอกข้อมูลให้ครบก่อนยืนยันการจอง");
      return;
    }

    const bookingData = {
      user_id: userId,
      room_id: selectedRoom.id,
      start_date: moveInDate,
      end_date: moveOutDate,
      billing_cycle: billingCycle,
      status: "pending",
    };

    try {
      await API.post("/bookings", bookingData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success(
        "✅ จองห้องเรียบร้อยแล้ว (รอการยืนยันจากเจ้าของหรือพนักงาน)",
      );
      setShowConfirmModal(false);
      setBillingCycle("");
      setMoveInDate("");
      setMoveOutDate("");
    } catch (error) {
      console.error("❌ Booking Error:", error);
      toast.error("❌ ไม่สามารถจองห้องได้ กรุณาลองใหม่อีกครั้ง");
    }
  };

  const openImageModal = (images) => {
    setSelectedRoomImages(images || []);
    setModalOpen(true);
  };

  const closeImageModal = () => {
    setModalOpen(false);
    setSelectedRoomImages([]);
  };
  if (loading) {
    return (
      <Layout showFooter={false} showNav={false}>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!property) {
    return (
      <Layout showFooter={false} showNav={false}>
        <div className="text-center py-12">
          <div className="text-5xl mb-4 text-gray-300">
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            ไม่พบข้อมูลหอพัก
          </h3>
          <p className="text-gray-500 mb-6">
            ขออภัย ไม่พบข้อมูลหอพักที่คุณกำลังหา
          </p>
          <button
            onClick={() => navigate(-1)}
            className="bg-gradient-to-r from-primary to-accent text-white px-4 py-2 rounded-full text-sm font-medium hover:shadow-lg transition-all duration-300"
          >
            กลับไปหน้าก่อนหน้า
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showFooter={false} showNav={false}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-indigo-70 to-purple-150 text-white shadow-lg pt-0 px-2 md:px-4 lg:px-6">
          <div className="mb-1 py-2">
            {/* Mobile Layout */}
            <div className="md:hidden flex justify-between items-center mb-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center text-white bg-gradient-to-r from-primary to-accent px-4 py-2 rounded-full shadow-md hover:shadow-lg transition-all duration-300"
              >
                <i className="fas fa-arrow-left mr-2"></i> กลับ
              </button>

              <div className="flex items-center space-x-2">
                <div className="flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full">
                  <i className="fas fa-check-circle mr-1"></i>
                  <span className="text-xs font-medium">พร้อมเข้าอยู่</span>
                </div>
                <div className="flex items-center bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">
                  <i className="fas fa-star mr-1"></i>
                  <span className="text-xs font-medium">
                    {property.rating || "N/A"}
                  </span>
                </div>
              </div>
            </div>
            {/* Desktop Layout */}
            <div className="hidden md:flex justify-between items-start">
              <div className="flex-1">
                <h1 className="text-3xl font-bold font-kanit gradient-text mb-2">
                  {property.name}
                </h1>
                <div className="flex items-center text-gray-600">
                  <i className="fas fa-map-marker-alt mr-2 text-primary"></i>
                  <span>{property.address}</span>
                </div>
              </div>

              <div className="flex flex-col items-end ml-6">
                <button
                  onClick={() => navigate(-1)}
                  className="flex items-center text-white bg-gradient-to-r from-primary to-accent px-4 py-2 rounded-full shadow-md hover:shadow-lg transition-all duration-300 mb-3"
                >
                  <i className="fas fa-arrow-left mr-2"></i> กลับ
                </button>

                <div className="flex items-center space-x-3">
                  <div
                    className={`flex items-center px-3 py-1 rounded-full ${
                      property.available_rooms === 0
                        ? "bg-red-100 text-red-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    <i
                      className={`fas fa-check-circle mr-1 ${
                        property.available_rooms === 0 ? "hidden" : ""
                      }`}
                    ></i>
                    <span className="text-xs font-medium">
                      {property.available_rooms === 0
                        ? "ไม่มีห้องว่าง"
                        : "พร้อมเข้าอยู่"}
                    </span>
                  </div>

                  <div className="flex items-center bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">
                    <i className="fas fa-star mr-1"></i>
                    <span className="text-sm font-medium">
                      {property.rating || "ไม่มีรีวิว"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              {[
                "overview",
                "rooms",
                "furniture",
                "facilities",
                "location",
                "reviews",
              ].map((tab) => (
                <button
                  key={tab}
                  className={`py-4 px-1 text-center border-b-2 font-medium text-sm ${
                    activeTab === tab
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === "overview" && "ภาพรวม"}
                  {tab === "rooms" && "ห้องพัก"}
                  {tab === "furniture" && "เฟอร์นิเจอร์"}
                  {tab === "facilities" && "สิ่งอำนวยความสะดวก"}
                  {tab === "location" && "ที่ตั้ง"}
                  {tab === "reviews" && "รีวิว"}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          {activeTab === "overview" && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="rounded-xl overflow-hidden h-80">
                  <img
                    src={
                      property.image
                        ? `${import.meta.env.VITE_API_URL}${property.image}`
                        : "/default-dorm.jpg"
                    }
                    alt={property.name}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-110 cursor-pointer"
                    onClick={() => setImageModalOpen(true)}
                  />
                </div>
                <div>
                  <h2 className="text-xl font-bold mb-4">ข้อมูลทั่วไป</h2>
                  <p className="text-gray-600 mb-6">{property.description}</p>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-indigo-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500 mb-1">
                        ราคาเริ่มต้น
                      </div>
                      <div className="text-xl font-bold text-primary">
                        ฿
                        {property.min_price_monthly != null
                          ? property.min_price_monthly.toLocaleString()
                          : "-"}
                        <span className="text-sm font-normal text-gray-500">
                          /เดือน
                        </span>
                      </div>
                    </div>
                    <div className="bg-indigo-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500 mb-1">ห้องว่าง</div>
                      <div className="text-xl font-bold text-primary">
                        {property.available_rooms || 0}
                        <span className="text-sm font-normal text-gray-500">
                          /{property.total_rooms}
                        </span>
                      </div>
                    </div>
                    <div className="bg-indigo-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500 mb-1">ค่าไฟ</div>
                      <div className="text-xl font-bold text-primary">
                        ฿{property.price_electric || "-"}
                        <span className="text-sm font-normal text-gray-500">
                          /บาทต่อหน่วย
                        </span>
                      </div>
                    </div>
                    <div className="bg-indigo-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500 mb-1">ค่าน้ำ</div>
                      <div className="text-xl font-bold text-primary">
                        ฿{property.price_water || "-"}
                        <span className="text-sm font-normal text-gray-500">
                          /บาทต่อหน่วย
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-4">
                    <button
                    disabled
                      className="flex-1 bg-gradient-to-r from-primary to-accent text-white py-3 rounded-lg font-medium hover:shadow-lg transition-all duration-300"
                      onClick={() => {
                        const token = localStorage.getItem("token");
                        if (!token) {
                          toast.info("กรุณาเข้าสู่ระบบก่อนทำการจอง");
                          // navigate("/login");
                          return;
                        }
                        setShowBookingModal(true);
                      }}
                    >
                      <i className="fas fa-clipboard-list mr-2"></i> จองห้อง
                    </button>
                    <button className="flex-1 bg-white border border-primary text-primary py-3 rounded-lg font-medium hover:bg-indigo-50 transition-all duration-300">
                      <i className="fas fa-calendar-check mr-2"></i> นัดชมห้อง
                    </button>
                  </div>
                </div>
              </div>

              <h2 className="text-xl font-bold mb-4">ติดต่อเจ้าของ</h2>
              <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                {property.owners && property.owners.length > 0 ? (
                  property.owners.map((owner) => (
                    <div
                      key={owner.id}
                      className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                      <div className="flex items-center">
                        <i className="fas fa-user-circle text-gray-500 text-xl mr-3"></i>
                        <div>
                          <div className="text-sm text-gray-500">เจ้าของ</div>
                          <div className="font-medium">
                            {owner.fullname || "-"}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <i className="fas fa-phone-alt text-gray-500 text-xl mr-3"></i>
                        <div>
                          <div className="text-sm text-gray-500">
                            เบอร์โทรศัพท์
                          </div>
                          <div className="font-medium">
                            {owner.phone || "-"}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <i className="fab fa-line text-gray-500 text-xl mr-3"></i>
                        <div>
                          <div className="text-sm text-gray-500">ID Line</div>
                          <div className="font-medium">{owner.line || "-"}</div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <i className="fas fa-envelope text-gray-500 text-xl mr-3"></i>
                        <div>
                          <div className="text-sm text-gray-500">อีเมล</div>
                          <div className="font-medium">
                            {owner.email || "-"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500">ไม่พบข้อมูลเจ้าของ</div>
                )}
              </div>
            </div>
          )}
          {activeTab === "rooms" && (
            <div>
              <h2 className="text-xl font-bold mb-4">ห้องพักทั้งหมด</h2>
              {property.rooms && property.rooms.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ห้อง
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ราคา/เดือน
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ราคา/เทอม
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ราคาประกัน
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ประเภทห้อง
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          สถานะ
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ภาพห้อง
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {property.rooms.map((room) => (
                        <tr key={room.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {room.name || room.code}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-bold text-primary">
                              ฿
                              {room.price_monthly != null
                                ? Number(room.price_monthly).toLocaleString(
                                    "en-US",
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    },
                                  )
                                : "-"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-bold text-primary">
                              ฿
                              {room.price_term != null
                                ? Number(room.price_term).toLocaleString(
                                    "en-US",
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    },
                                  )
                                : "-"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-bold text-primary">
                              ฿
                              {room.deposit != null
                                ? Number(room.deposit).toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })
                                : "-"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              <span className="mr-2">
                                <i
                                  className={`fas fa-snowflake ${
                                    room.has_ac
                                      ? "text-blue-500"
                                      : "text-gray-300"
                                  }`}
                                ></i>
                                {room.has_ac ? " แอร์" : " -"}
                              </span>
                              <span className="mr-2">
                                <i
                                  className={`fas fa-fan ${
                                    room.has_fan
                                      ? "text-blue-500"
                                      : "text-gray-300"
                                  }`}
                                ></i>
                                {room.has_fan ? " พัดลม" : " -"}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                room.status === "available"
                                  ? "bg-green-100 text-green-800"
                                  : room.status === "booked"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {room.status === "available"
                                ? "ว่าง"
                                : room.status === "booked"
                                  ? "ไม่ว่าง"
                                  : "ซ่อมบำรุง"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => openImageModal(room.images)}
                              className="text-primary hover:underline"
                            >
                              ดูรูปภาพ
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">
                    <i className="fas fa-door-closed text-4xl"></i>
                  </div>
                  <p className="text-gray-500">ยังไม่มีข้อมูลห้องพัก</p>
                </div>
              )}
            </div>
          )}
          {activeTab === "furniture" && (
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <i className="fas fa-couch text-purple-500 mr-2"></i>
                เฟอร์นิเจอร์ในแต่ละห้อง
              </h2>

              {property.rooms && property.rooms.length > 0 ? (
                <div className="space-y-6">
                  {property.rooms.map((room, roomIndex) => (
                    <div
                      key={roomIndex}
                      className="p-4 bg-gray-50 rounded-xl shadow-sm border border-gray-100"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-lg text-gray-800 flex items-center">
                          <i className="fas fa-door-open mr-2 text-indigo-500"></i>
                          ห้อง {room.name || `#${room.id}`}
                        </h3>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            room.status === "available"
                              ? "bg-green-100 text-green-600"
                              : room.status === "booked"
                                ? "bg-yellow-100 text-yellow-600"
                                : "bg-red-100 text-red-600"
                          }`}
                        >
                          {room.status === "available"
                            ? "ว่าง"
                            : room.status === "booked"
                              ? "ไม่ว่าง"
                              : "กำลังซ่อมบำรุง"}
                        </span>
                      </div>

                      {room.furnitures && room.furnitures.length > 0 ? (
                        <ul className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {room.furnitures.map((furniture, index) => (
                            <li
                              key={index}
                              className="flex items-center bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition"
                            >
                              <span className="text-sm text-gray-700">
                                {furniture.name}{" "}
                                <span className="text-gray-400">
                                  (x{furniture.quantity})
                                </span>
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-400 text-sm italic mt-2">
                          ไม่มีข้อมูลเฟอร์นิเจอร์สำหรับห้องนี้
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">
                    <i className="fas fa-bed text-4xl"></i>
                  </div>
                  <p className="text-gray-500">ยังไม่มีข้อมูลห้องในหอพักนี้</p>
                </div>
              )}
            </div>
          )}
          {activeTab === "facilities" && (
            <div>
              <h2 className="text-xl font-bold mb-4">สิ่งอำนวยความสะดวก</h2>
              {property.facilities && property.facilities.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {property.facilities.map((facility, index) => (
                    <div
                      key={index}
                      className="flex items-center p-3 bg-gray-50 rounded-lg"
                    >
                      <i
                        className={`fas ${
                          facility.icon || "fa-check-circle"
                        } text-primary mr-3`}
                      ></i>
                      <span className="text-sm">{facility.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">
                    <i className="fas fa-info-circle text-4xl"></i>
                  </div>
                  <p className="text-gray-500">
                    ยังไม่มีข้อมูลสิ่งอำนวยความสะดวก
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "location" && (
            <div>
              <h2 className="text-xl font-bold mb-4">ที่ตั้ง</h2>
              <div className="mb-4">
                <p className="text-gray-600 mb-4">
                  <i className="fas fa-map-marker-alt mr-2 text-primary"></i>
                  {property.address}
                </p>
              </div>
              <div className="rounded-xl overflow-hidden h-96 shadow-lg">
                <iframe
                  title="map"
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  style={{ border: 0 }}
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(
                    property.name + ", " + property.address,
                  )}&output=embed&z=15`}
                  allowFullScreen
                ></iframe>
              </div>

              <div className="mt-4 flex justify-center space-x-4">
                <a
                  href={`https://maps.google.com/maps?q=${encodeURIComponent(
                    property.name + ", " + property.address,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-primary hover:text-accent transition-colors duration-300"
                >
                  <i className="fas fa-external-link-alt mr-2"></i>
                  เปิดใน Google Maps
                </a>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                    property.name + ", " + property.address,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-primary hover:text-accent transition-colors duration-300"
                >
                  <i className="fas fa-directions mr-2"></i>
                  นำทาง
                </a>
              </div>
            </div>
          )}

          {activeTab === "reviews" && (
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <i className="fas fa-comments text-indigo-500 mr-2"></i>
                รีวิวจากผู้เข้าพัก
              </h2>

              {property.reviews && property.reviews.length > 0 ? (
                <div className="space-y-4">
                  {property.reviews.map((review, index) => (
                    <div
                      key={index}
                      className="border-b border-gray-200 pb-4 last:border-0"
                    >
                      {/* User Info with Avatar and Name */}
                      <div className="flex items-center mb-2">
                        <img
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                            review.user_name,
                          )}&background=random&color=white`}
                          alt={review.user_name}
                          className="w-8 h-8 rounded-full mr-3"
                        />
                        <div className="font-medium">{review.user_name}</div>
                      </div>

                      {/* Rating Stars with Icon */}
                      <div className="flex items-center mb-2">
                        <div className="flex text-yellow-400 mr-2">
                          {[...Array(5)].map((_, i) => (
                            <i
                              key={i}
                              className={`fas fa-star ${
                                i < review.rating ? "" : "text-gray-300"
                              }`}
                            ></i>
                          ))}
                        </div>
                      </div>

                      {/* Comment with Quote Icon */}
                      <div className="relative pl-4 border-l-4 border-indigo-100 mb-2">
                        <i className="fas fa-quote-left text-indigo-200 absolute left-0 top-2 text-lg"></i>
                        <p className="text-gray-600">{review.comment}</p>
                      </div>

                      {/* Timestamp with Calendar Icon */}
                      <div className="text-xs text-gray-400 flex items-center">
                        <i className="far fa-calendar-alt mr-1"></i>
                        {new Date(review.created_at).toLocaleDateString(
                          "th-TH",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          },
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">
                    <i className="fas fa-comment-slash text-4xl"></i>
                  </div>
                  <p className="text-gray-500">ยังไม่มีรีวิวสำหรับหอพักนี้</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {/* ===== Modal จองห้อง ===== */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl overflow-hidden animate-fadeIn">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-bold text-primary">
                🏠 รายการห้องที่สามารถจองได้
              </h2>
              <button
                onClick={() => setShowBookingModal(false)}
                className="text-gray-500 hover:text-red-500"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            {/* Table แสดงห้อง */}
            <div className="overflow-x-auto max-h-[70vh]">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      ชื่อห้อง
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      รายเดือน
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      รายเทอม
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      เงินประกัน
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      สิ่งอำนวยความสะดวก
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      + จองห้อง
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {property.rooms && property.rooms.length > 0 ? (
                    property.rooms.filter((room) => room.status === "available")
                      .length > 0 ? (
                      property.rooms
                        .filter((room) => room.status === "available")
                        .map((room) => (
                          <tr key={room.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {room.name || room.code}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-primary">
                              ฿
                              {room.price_monthly != null
                                ? Number(room.price_monthly).toLocaleString(
                                    "en-US",
                                    {
                                      minimumFractionDigits: 2,
                                    },
                                  )
                                : "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-primary">
                              ฿
                              {room.price_term != null
                                ? Number(room.price_term).toLocaleString(
                                    "en-US",
                                    {
                                      minimumFractionDigits: 2,
                                    },
                                  )
                                : "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-primary">
                              ฿
                              {room.deposit != null
                                ? Number(room.deposit).toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                  })
                                : "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              <span className="mr-2">
                                <i
                                  className={`fas fa-snowflake ${
                                    room.has_ac
                                      ? "text-blue-500"
                                      : "text-gray-300"
                                  }`}
                                ></i>
                                {room.has_ac ? " แอร์" : " -"}
                              </span>
                              <span className="mr-2">
                                <i
                                  className={`fas fa-fan ${
                                    room.has_fan
                                      ? "text-blue-500"
                                      : "text-gray-300"
                                  }`}
                                ></i>
                                {room.has_fan ? " พัดลม" : " -"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <button
                                onClick={() => handleBookRoom(room)}
                                className="bg-gradient-to-r from-primary to-accent text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-md hover:scale-105 transition-all duration-300"
                              >
                                <i className="fa-solid fa-calendar-plus mr-2"></i>{" "}
                                จองห้อง
                              </button>
                            </td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td
                          colSpan="5"
                          className="px-6 py-4 text-center text-gray-400"
                        >
                          ❌ ไม่มีห้องว่าง
                        </td>
                      </tr>
                    )
                  ) : (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-6 py-4 text-center text-gray-400"
                      >
                        ไม่มีข้อมูลห้อง
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="flex flex-col items-end p-4 border-t space-y-2">
              <div className="w-full text-left bg-yellow-50 border border-yellow-300 text-yellow-800 text-sm rounded-md px-3 py-2">
                ⚠️ <span className="font-semibold">คำเตือน:</span>
                กรุณาติดต่อเจ้าของหรือพนักงานก่อนทำการจอง
                เนื่องจากสิทธิ์ของคุณอาจถูกปลดอัตโนมัติหากไม่ได้รับการยืนยัน
              </div>

              <button
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                onClick={() => setShowBookingModal(false)}
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
      {showConfirmModal && selectedRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 animate-fadeIn">
            {/* Header */}
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h2 className="text-lg font-bold text-primary">
                <i className="fa-solid fa-calendar-check mr-2"></i>{" "}
                ยืนยันการจองห้อง
              </h2>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="text-gray-500 hover:text-red-500"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* เนื้อหา */}
            <div className="space-y-4">
              <p className="text-gray-700">
                <span className="font-semibold">ชื่อห้อง:</span>{" "}
                {selectedRoom.name || selectedRoom.code}
              </p>

              {/* ตัวเลือกแบบรายเดือน/รายเทอม */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  เลือกรูปแบบการจอง
                </label>
                <select
                  value={billingCycle}
                  onChange={(e) => setBillingCycle(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">-- เลือกรูปแบบ --</option>
                  <option value="monthly">รายเดือน</option>
                  <option value="term">รายเทอม</option>
                </select>
              </div>

              {/* แสดงราคาตามที่เลือก */}
              {billingCycle && (
                <p className="text-gray-700">
                  <span className="font-semibold">
                    ราคาต่อ{billingCycle === "monthly" ? "เดือน" : "เทอม"}:
                  </span>{" "}
                  <span className="text-primary font-bold">
                    ฿
                    {Number(
                      billingCycle === "monthly"
                        ? selectedRoom.price_monthly
                        : selectedRoom.price_term,
                    ).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </p>
              )}

              {/* วันที่เข้า-ออก */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  วันที่เข้าอยู่
                </label>
                <input
                  type="date"
                  value={moveInDate}
                  onChange={(e) => setMoveInDate(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  วันที่ออก
                </label>
                <input
                  type="date"
                  value={moveOutDate}
                  onChange={(e) => setMoveOutDate(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="bg-yellow-50 text-yellow-800 text-sm p-2 rounded-md border border-yellow-300">
                ⚠️ ถ้าคุณติดต่อเจ้าของหรือพนักงานแล้วสามารถทำการจองได้เลย!
              </div>
            </div>

            {/* ปุ่ม */}
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmBooking}
                className="bg-gradient-to-r from-primary to-accent text-white px-4 py-2 rounded-lg hover:shadow-md hover:scale-105 transition-all"
              >
                ยืนยันการจอง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal รูปหอ*/}
      {imageModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 w3-animate-zoom"
          onClick={() => setImageModalOpen(false)}
        >
          <img
            className="max-h-[90vh] max-w-[90vw] object-contain"
            src={
              property.image
                ? `${import.meta.env.VITE_API_URL}${property.image}`
                : "/default-dorm.jpg"
            }
            alt={property.name}
          />
        </div>
      )}
      {/* Image Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 transition-all duration-300">
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-5xl w-full mx-4 overflow-hidden transform transition-transform duration-300 scale-95 md:scale-100">
            {/* Close Button */}
            <button
              onClick={closeImageModal}
              className="absolute top-4 right-4 z-50 text-gray-400 hover:text-white hover:bg-gray-700 bg-gray-800 bg-opacity-30 rounded-full p-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <i className="fas fa-times text-xl"></i>
            </button>

            {/* Image Container */}
            <div className="p-6">
              {selectedRoomImages && selectedRoomImages.length > 0 ? (
                <div
                  className={`grid gap-4 ${
                    selectedRoomImages.length === 1
                      ? "grid-cols-1"
                      : selectedRoomImages.length === 2
                        ? "grid-cols-2"
                        : "grid-cols-3"
                  }`}
                >
                  {selectedRoomImages.map((img, idx) => (
                    <div
                      key={idx}
                      className={`overflow-hidden rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 w-full`}
                    >
                      <img
                        src={`${import.meta.env.VITE_API_URL}${img}`}
                        alt={`Room image ${idx + 1}`}
                        className="w-full aspect-[4/3] object-cover transition-transform duration-300 hover:scale-105"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-gray-500">
                  <i className="fas fa-image text-4xl mb-4 block"></i>
                  <p className="text-lg">ไม่มีรูปภาพห้อง</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default PropertyDetail;

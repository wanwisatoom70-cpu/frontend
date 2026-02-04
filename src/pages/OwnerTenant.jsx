// src/pages/OwnerTenant.jsx
import React, { useEffect, useState, useCallback } from "react";
import Layout from "../components/Layout";
import API from "../api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const OwnerTenant = () => {
  const [tenants, setTenants] = useState([]);
  const [editingTenant, setEditingTenant] = useState(null);
  const [form, setForm] = useState({
    username: "",
    fullname: "",
    password_hash: "",
    selectedProperties: [],
    selectedRooms: [],
    start_date: "",
    end_date: "",
    status: "confirmed",
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [properties, setProperties] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [roomBillingCycles, setRoomBillingCycles] = useState({});
  const [usernameStatus, setUsernameStatus] = useState({
    checking: false,
    valid: false,
    message: "",
  });
  // เพิ่ม state สำหรับเก็บห้องที่แสดงในการ์ด
  const [expandedRoomCards, setExpandedRoomCards] = useState({});
  const [showGuestsOnly, setShowGuestsOnly] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    message: "",
    onConfirm: null,
  });
  const showConfirmModal = (message, onConfirm) => {
    setConfirmModal({ show: true, message, onConfirm });
  };

  const closeConfirmModal = () => {
    setConfirmModal({ show: false, message: "", onConfirm: null });
  };

  // เพิ่มฟังก์ชันสำหรับตรวจสอบ username
  const checkUsernameAvailability = useCallback(
    async (username) => {
      if (!username.trim()) {
        setUsernameStatus({
          checking: false,
          valid: false,
          message: "",
        });
        return;
      }
      try {
        setUsernameStatus({
          checking: true,
          valid: false,
          message: "กำลังตรวจสอบ...",
        });

        // Fixed endpoint URL and parameter passing
        const url = editingTenant
          ? `/users/check-username/${encodeURIComponent(username)}?userId=${
              editingTenant.id
            }`
          : `/users/check-username/${encodeURIComponent(username)}`;

        const res = await API.get(url);
        setUsernameStatus({
          checking: false,
          valid: res.data.valid,
          message: res.data.message,
        });
      } catch (err) {
        setUsernameStatus({
          checking: false,
          valid: false,
          message: "username ต้อง 4ตัวขึ้นไป และไม่มีช่องว่าง ห้ามใช้ก-ฮ",
        });
        console.error(err);
      }
    },
    [editingTenant]
  );

  useEffect(() => {
    // ถ้ากำลังแก้ไขผู้เช่า และ username เดิมคือ username ที่กำลังแก้ไข ไม่ต้องตรวจสอบ
    if (editingTenant && editingTenant.username === form.username) {
      setUsernameStatus({
        checking: false,
        valid: true,
        message: "",
      });
      return;
    }
    // ตั้งเวลาเพื่อไม่ให้เรียก API บ่อยเกินไป (debounce)
    const timer = setTimeout(() => {
      checkUsernameAvailability(form.username);
    }, 200);
    return () => clearTimeout(timer);
  }, [form.username, checkUsernameAvailability, editingTenant]);

  // Fetch properties owned by the current user
  const fetchProperties = async () => {
    try {
      const res = await API.get("/properties/my");
      setProperties(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch all rooms
  const fetchRooms = async () => {
    try {
      const res = await API.get("/rooms/my");
      setRooms(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const res = await API.get("/tenants");
      setTenants(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
    fetchProperties();
    fetchRooms();
  }, []);

  // Filter rooms based on selected properties
  useEffect(() => {
    if (form.selectedProperties.length === 0) {
      setFilteredRooms([]);
      return;
    }

    const filtered = rooms.filter((room) => {
      // ต้องเป็น property ที่เลือก
      if (!form.selectedProperties.includes(room.property_id)) return false;

      if (!editingTenant) {
        // กรณีเพิ่ม: แสดงเฉพาะห้องว่าง
        return room.status === "available" || room.status === "pending";
      } else {
        // กรณีแก้ไข: แสดงห้องว่างหรือเป็นห้องของ tenant นี้
        return (
          room.status === "available" || form.selectedRooms.includes(room.id)
        );
      }
    });

    setFilteredRooms(filtered);
  }, [form.selectedProperties, rooms, editingTenant, form.selectedRooms]);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toISOString().split("T")[0]; // ตัดเวลาออก
  };

  const handleOpenModal = (tenant = null) => {
    setEditingTenant(tenant);

    const selectedProperties =
      tenant?.bookings?.map((b) => b.property_id) || [];
    const selectedRooms = tenant?.bookings?.map((b) => b.room_id) || [];

    // แปลงค่า billing_cycle ให้ตรงกับ select
    const billingCycles = {};
    tenant?.bookings?.forEach((b) => {
      if (b.billing_cycle === "monthly") billingCycles[b.room_id] = "เดือน";
      else if (b.billing_cycle === "term") billingCycles[b.room_id] = "เทอม";
    });
    setRoomBillingCycles(billingCycles);

    setForm({
      username: tenant?.username || "",
      fullname: tenant?.fullname || "",
      password_hash: "",
      selectedProperties,
      selectedRooms,
      start_date: tenant?.bookings?.[0]?.start_date
        ? formatDate(tenant.bookings[0].start_date)
        : "",
      end_date: tenant?.bookings?.[0]?.end_date
        ? formatDate(tenant.bookings[0].end_date)
        : "",
      status: tenant?.bookings?.[0]?.status || "confirmed",
      role: tenant?.role || "tenant",
    });

    setUsernameStatus({ checking: false, valid: false, message: "" });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ตรวจสอบว่า username ว่างหรือไม่
    if (
      !usernameStatus.valid &&
      !(editingTenant && editingTenant.username === form.username)
    ) {
      alert("กรุณาตรวจสอบ username อีกครั้ง");
      return;
    }

    try {
      const tenantData = {
        username: form.username,
        fullname: form.fullname,
        password_hash: form.password_hash,
        property_ids: form.selectedProperties,
        room_ids: form.selectedRooms,
        start_date: form.start_date,
        end_date: form.end_date,
        status: form.status,
        billing_cycles: Object.fromEntries(
          Object.entries(roomBillingCycles).map(([roomId, value]) => [
            roomId,
            value === "เดือน" ? "monthly" : "term",
          ])
        ),
      };

      if (editingTenant) {
        await API.put(`/tenants/${editingTenant.id}`, tenantData);
        toast.success("แก้ไขข้อมูลผู้เช่าสำเร็จ");
      } else {
        await API.post("/tenants", tenantData);
        toast.success("เพิ่มผู้เช่าสำเร็จ");
      }

      setModalOpen(false);
      fetchTenants();
    } catch (err) {
      console.error(err);
      toast.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    }
  };

  const handlePropertyChange = (propertyId) => {
    setForm({
      ...form,
      selectedProperties: [propertyId], // เก็บเป็น array แต่มีแค่ 1 ค่า
      selectedRooms: [], // reset ห้องทุกครั้งที่เปลี่ยนหอ
    });
  };

  const handleRoomChange = (roomId) => {
    setForm({
      ...form,
      selectedRooms: [roomId], // เก็บเป็น array แต่มีแค่ 1 ค่า
    });

    // เซ็ต billing cycle ตามห้องที่เลือก
    const selectedRoom = rooms.find((r) => r.id === roomId);
    if (selectedRoom) {
      setRoomBillingCycles({
        [roomId]: selectedRoom.billing_cycle === "monthly" ? "เดือน" : "เทอม",
      });
    }
  };

  const handleAdd = (id) => {
    showConfirmModal("คุณแน่ใจหรือไม่ที่จะเพิ่มผู้เช่านี้?", async () => {
      try {
        await API.put(`/tenants/confirm/${id}`);
        toast.success("ยืนยันการเพิ่มผู้เช่าสำเร็จ");
        fetchTenants();
      } catch (err) {
        console.error(err);
        toast.error("เกิดข้อผิดพลาดในการเพิ่มข้อมูลผู้เช่า");
      }
    });
  };

  const handleDelete = (id) => {
    showConfirmModal("คุณแน่ใจหรือไม่ที่จะลบผู้เช่านี้?", async () => {
      try {
        await API.delete(`/tenants/${id}`);
        toast.success("ลบผู้เช่าสำเร็จ");
        fetchTenants();
      } catch (err) {
        console.error(err);
        toast.error("เกิดข้อผิดพลาดในการลบข้อมูล");
      }
    });
  };

  // เพิ่มฟังก์ชันสำหรับขยาย/ย่อการ์ดห้อง
  const toggleExpandRoomCard = (tenantId) => {
    setExpandedRoomCards((prev) => ({
      ...prev,
      [tenantId]: !prev[tenantId],
    }));
  };

  const filteredTenants = tenants.filter((tenant) => {
    // ถ้า checkbox ถูกติ๊ก ให้แสดงเฉพาะ pending
    if (showGuestsOnly) {
      return tenant.role === "guest";
    }

    // ถ้า checkbox ไม่ติ๊ก แสดงเฉพาะ tenant (ไม่เอา guest)
    if (tenant.role !== "tenant") return false;

    const username = tenant.username?.toLowerCase() || "";
    const fullname = tenant.fullname?.toLowerCase() || "";
    const email = tenant.email?.toLowerCase() || "";

    const bookingsMatch = tenant.bookings?.some((booking) => {
      const propertyName = booking.property_name?.toLowerCase() || "";
      const roomName = booking.room_name?.toLowerCase() || "";
      const roomCode = booking.room_code?.toLowerCase() || "";
      return (
        propertyName.includes(searchTerm.toLowerCase()) ||
        roomName.includes(searchTerm.toLowerCase()) ||
        roomCode.includes(searchTerm.toLowerCase())
      );
    });

    return (
      username.includes(searchTerm.toLowerCase()) ||
      fullname.includes(searchTerm.toLowerCase()) ||
      email.includes(searchTerm.toLowerCase()) ||
      bookingsMatch
    );
  });

  return (
    <Layout role="owner" showFooter={false} showNav={false}>
      {/* Sticky Header with Gradient Background */}
      <div className="sticky top-0 z-10 bg-teal-400 text-white shadow-lg pb-4 pt-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-kanit mb-1">
                จัดการผู้เช่า
              </h1>
              <p className="text-indigo-100 text-sm">
                เพิ่ม แก้ไข และลบข้อมูลผู้เช่า
              </p>
            </div>
            <button
              onClick={() => handleOpenModal()}
              className="mt-3 sm:mt-0 bg-white text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center shadow-md hover:shadow-lg"
            >
              <i className="fas fa-user-plus mr-2"></i> เพิ่มผู้เช่าใหม่
            </button>
          </div>

          {/* Search Bar + Checkbox */}
          <div className="flex flex-wrap items-center space-x-4 my-2 max-w-md">
            {/* Search Input */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="ค้นหาผู้เช่า, หอพัก, ห้อง..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-800"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute left-3 top-2.5 text-gray-400">
                <i className="fas fa-search"></i>
              </div>
            </div>

            {/* Checkbox */}
            {/* <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showGuestsOnly"
                checked={showGuestsOnly}
                onChange={(e) => setShowGuestsOnly(e.target.checked)}
                className="cursor-pointer"
              />
              <label
                htmlFor="showGuestsOnly"
                className="text-gray-700 cursor-pointer"
              >
                ผู้ที่รออนุมัติ
              </label>
            </div> */}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-h-[calc(93vh-120px)] overflow-y-auto bg-teal-50 p-4 md:p-6">
        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-lg p-6 animate-pulse"
              >
                <div className="flex items-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-gray-200 mr-4"></div>
                  <div className="flex-1">
                    <div className="h-6 w-3/4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
                  </div>
                </div>
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center">
                      <div className="h-4 w-4 bg-gray-200 rounded-full mr-3"></div>
                      <div className="h-4 w-full bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                  <div className="h-8 w-16 bg-gray-200 rounded"></div>
                  <div className="h-8 w-16 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredTenants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl shadow-lg">
            <div className="text-indigo-500 mb-4">
              <i className="fas fa-users text-5xl"></i>
            </div>
            <h3 className="text-xl font-bold font-kanit mb-2">
              {searchTerm ? "ไม่พบผู้เช่าที่ค้นหา" : "ยังไม่มีผู้เช่า"}
            </h3>
            <p className="text-gray-600 mb-6 max-w-md text-center">
              {searchTerm
                ? "ลองค้นหาด้วยคำอื่นหรือตรวจสอบการสะกด"
                : "เริ่มต้นโดยการเพิ่มผู้เช่าคนแรก"}
            </p>
            {!searchTerm && (
              <button
                onClick={() => handleOpenModal()}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-full font-medium hover:shadow-lg transition-all duration-300 flex items-center"
              >
                <i className="fas fa-user-plus mr-2"></i> เพิ่มผู้เช่าใหม่
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTenants.map((t) => (
              <div
                key={t.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1"
              >
                {/* Tenant Header */}
                <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50">
                  <div className="flex items-center">
                    {t.profile_image ? (
                      <img
                        src={
                          t.profile_image.startsWith("http")
                            ? t.profile_image
                            : `http://localhost:5000${t.profile_image}`
                        }
                        alt={t.fullname}
                        className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-md"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center shadow-md">
                        <i className="fas fa-user text-xl text-indigo-500"></i>
                      </div>
                    )}
                    <div className="ml-3">
                      <h3 className="text-lg font-bold font-kanit text-gray-800">
                        {t.fullname}
                      </h3>
                      <p className="text-gray-600 text-xs">@{t.username}</p>
                    </div>
                  </div>
                </div>

                {/* Tenant Details - Compact Version */}
                <div className="p-4">
                  {/* Quick Contact Info */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    <div className="flex items-center bg-blue-50 rounded-full px-3 py-1 text-xs">
                      <i className="fas fa-envelope text-blue-500 mr-1"></i>
                      <span className="text-blue-700">{t.email}</span>
                    </div>
                    {t.phone && (
                      <div className="flex items-center bg-green-50 rounded-full px-3 py-1 text-xs">
                        <i className="fas fa-phone text-green-500 mr-1"></i>
                        <span className="text-green-700">{t.phone}</span>
                      </div>
                    )}
                    {t.line && (
                      <div className="flex items-center bg-purple-50 rounded-full px-3 py-1 text-xs">
                        <i className="fab fa-line text-purple-500 mr-1"></i>
                        <span className="text-purple-700">{t.line}</span>
                      </div>
                    )}
                    {t.age && (
                      <div className="flex items-center bg-yellow-50 rounded-full px-3 py-1 text-xs">
                        <i className="fas fa-birthday-cake text-yellow-500 mr-1"></i>
                        <span className="text-yellow-700">{t.age} ปี</span>
                      </div>
                    )}
                    {t.id_line && (
                      <div className="flex items-center bg-purple-50 rounded-full px-3 py-1 text-xs">
                        <i className="fab fa-line text-purple-500 mr-1"></i>
                        <span className="text-purple-700">{t.id_line}</span>
                      </div>
                    )}
                  </div>
                  {/* Property and Room Information */}
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <i className="fas fa-building mr-2 text-indigo-500"></i>
                      ที่พักอาศัย
                    </h4>

                    {t.bookings && t.bookings.length > 0 ? (
                      <div className="space-y-2">
                        {t.bookings
                          .slice(
                            0,
                            expandedRoomCards[t.id] ? t.bookings.length : 1
                          )
                          .map((booking, index) => (
                            <div
                              key={index}
                              className="bg-indigo-50 rounded-lg p-3 border border-indigo-100"
                            >
                              <div className="flex justify-between items-start mb-1">
                                <div>
                                  <p className="text-sm font-medium text-indigo-700">
                                    {booking.property_name}
                                  </p>
                                  <div className="flex items-center mt-1">
                                    <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full mr-2">
                                      {booking.room_code}
                                    </span>
                                    <span className="text-xs text-gray-600">
                                      <i className="fas fa-door-open mr-1"></i>
                                      {booking.room_name}
                                    </span>
                                    <span className="text-xs text-gray-500 ml-2">
                                      (ราย
                                      {booking.billing_cycle === "monthly"
                                        ? "เดือน"
                                        : "เทอม"}
                                      )
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex justify-between items-center mt-2">
                                <span
                                  className={`text-xs font-medium px-2 py-1 rounded ${
                                    booking.status === "confirmed"
                                      ? "bg-green-100 text-green-700"
                                      : booking.status === "pending"
                                      ? "bg-yellow-100 text-yellow-700"
                                      : "bg-red-100 text-red-700"
                                  }`}
                                >
                                  {booking.status === "confirmed"
                                    ? "ยืนยันแล้ว"
                                    : booking.status === "pending"
                                    ? "รอดำเนินการ"
                                    : "ยกเลิก"}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(
                                    booking.created_at
                                  ).toLocaleDateString("th-TH", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </span>
                              </div>
                            </div>
                          ))}

                        {t.bookings.length > 1 && (
                          <div className="text-center">
                            <button
                              onClick={() => toggleExpandRoomCard(t.id)}
                              className="text-xs text-indigo-600 hover:text-indigo-800"
                            >
                              {expandedRoomCards[t.id]
                                ? "แสดงน้อยลง"
                                : `และอีก ${t.bookings.length - 1} ที่พัก`}
                              <i
                                className={`fas ${
                                  expandedRoomCards[t.id]
                                    ? "fa-chevron-up"
                                    : "fa-chevron-down"
                                } ml-1`}
                              ></i>
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <p className="text-sm text-gray-500">
                          ไม่มีข้อมูลที่พักอาศัย
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                    <div className="text-xs text-gray-500">
                      {" "}
                      {new Date(t.created_at).toLocaleString("th-TH", {
                        dateStyle: "long",
                        timeStyle: "short",
                      })}
                    </div>

                    <div className="flex space-x-2">
                      {t.role === "tenant" && (
                        <button
                          onClick={() => handleOpenModal(t)}
                          className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 hover:bg-yellow-200 transition-colors duration-200"
                          title="แก้ไข"
                        >
                          <i className="fas fa-edit text-sm"></i>
                        </button>
                      )}
                      {t.role === "tenant" && (
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 hover:bg-red-200 transition-colors duration-200"
                          title="ลบ"
                        >
                          <i className="fas fa-trash-alt text-sm"></i>
                        </button>
                      )}
                      {t.role !== "tenant" && (
                        <button
                          onClick={() => handleAdd(t.id)}
                          className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 hover:bg-green-200 transition-colors duration-200"
                          title="ยืนยันการเช่า"
                        >
                          <i className="fas fa-check text-sm"></i>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* add edit */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md transform transition-all duration-300 scale-95 animate-fade-in-right">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold font-kanit">
                  {editingTenant ? "แก้ไขข้อมูลผู้เช่า" : "เพิ่มผู้เช่าใหม่"}
                </h2>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ชื่อผู้ใช้
                      </label>
                      <input
                        type="text"
                        disabled={editingTenant?.role === "guest"}
                        className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                          usernameStatus.message && !usernameStatus.valid
                            ? "border-red-500"
                            : usernameStatus.valid
                            ? "border-green-500"
                            : "border-gray-300"
                        }`}
                        value={form.username}
                        onChange={(e) =>
                          setForm({ ...form, username: e.target.value })
                        }
                        required
                      />
                      {usernameStatus.message && (
                        <div
                          className={`mt-1 text-sm ${
                            usernameStatus.valid
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {usernameStatus.checking ? (
                            <i className="fas fa-spinner fa-spin mr-1"></i>
                          ) : usernameStatus.valid ? (
                            <i className="fas fa-check-circle mr-1"></i>
                          ) : (
                            <i className="fas fa-exclamation-circle mr-1"></i>
                          )}
                          {usernameStatus.message}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        รหัสผ่าน{" "}
                        {editingTenant && (
                          <span className="text-gray-500 text-xs">
                            (เว้นว่างถ้าไม่เปลี่ยน)
                          </span>
                        )}
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          disabled={editingTenant?.role === "guest"}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          value={form.password_hash}
                          onChange={(e) =>
                            setForm({ ...form, password_hash: e.target.value })
                          }
                          {...(!editingTenant && { required: true })}
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={editingTenant?.role === "guest"}
                        >
                          <i
                            className={`fas ${
                              showPassword ? "fa-eye-slash" : "fa-eye"
                            } text-gray-400`}
                          ></i>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ชื่อ-นามสกุล
                      </label>
                      <input
                        type="text"
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        value={form.fullname}
                        onChange={(e) =>
                          setForm({ ...form, fullname: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        วันที่เริ่มสัญญา
                      </label>
                      <input
                        type="date"
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        value={form.start_date}
                        onChange={(e) =>
                          setForm({ ...form, start_date: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        วันที่สิ้นสุดสัญญา
                      </label>
                      <input
                        type="date"
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        value={form.end_date}
                        onChange={(e) =>
                          setForm({ ...form, end_date: e.target.value })
                        }
                      />
                    </div>

                    {/* <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        สถานะสัญญา
                      </label>
                      <select
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        value={form.status}
                        onChange={(e) =>
                          setForm({ ...form, status: e.target.value })
                        }
                      >
                        <option value="confirmed">ยืนยันแล้ว</option>
                        <option value="pending">รอดำเนินการ</option>
                      </select>
                    </div> */}
                  </div>
                </div>

                {/* Full-width fields */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    เลือกหอพัก
                  </label>
                  <div className="border border-gray-300 rounded-lg p-2 max-h-40 overflow-y-auto">
                    {properties.length === 0 ? (
                      <p className="text-gray-500 text-sm p-2">ไม่มีหอพัก</p>
                    ) : (
                      properties.map((property) => (
                        <div
                          key={property.id}
                          className="flex items-center mb-2"
                        >
                          <input
                            // type="checkbox"
                            type="radio" // ✅ เปลี่ยนเป็น radio
                            name="property"
                            id={`property-${property.id}`}
                            checked={form.selectedProperties.includes(
                              property.id
                            )}
                            onChange={() => handlePropertyChange(property.id)}
                            className="h-4 w-4 text-indigo-600 rounded"
                          />
                          <label
                            htmlFor={`property-${property.id}`}
                            className="ml-2 text-sm text-gray-700"
                          >
                            {property.name}
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    เลือกห้อง
                  </label>
                  <div className="border border-gray-300 rounded-lg p-2 max-h-40 overflow-y-auto">
                    {filteredRooms.length === 0 ? (
                      <p className="text-gray-500 text-sm p-2">
                        {form.selectedProperties.length === 0
                          ? "กรุณาเลือกหอพักก่อน"
                          : "ไม่มีห้องในหอพักที่เลือก"}
                      </p>
                    ) : (
                      filteredRooms.map((room) => (
                        <div key={room.id} className="flex items-center mb-2">
                          <input
                            // type="checkbox"
                            type="radio" // ✅ เปลี่ยนเป็น radio
                            name="room" // ต้องมี name เดียวกัน
                            id={`room-${room.id}`}
                            checked={form.selectedRooms.includes(room.id)}
                            onChange={() => handleRoomChange(room.id)}
                            className="h-4 w-4 text-indigo-600 rounded"
                          />
                          <label
                            htmlFor={`room-${room.id}`}
                            className="ml-2 text-sm text-gray-700"
                          >
                            {room.name} ({room.code})
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ประเภทการเช่า
                  </label>
                  {form.selectedRooms.map((roomId) => {
                    const room = rooms.find((r) => r.id === roomId);
                    if (!room) return null;
                    return (
                      <div
                        key={room.id}
                        className="mb-2 flex items-center space-x-2"
                      >
                        <span className="text-sm">
                          {room.name} ({room.code})
                        </span>
                        <select
                          value={roomBillingCycles[room.id] || "เดือน"}
                          onChange={(e) =>
                            setRoomBillingCycles((prev) => ({
                              ...prev,
                              [room.id]: e.target.value,
                            }))
                          }
                          className="p-1 border rounded text-sm"
                        >
                          <option value="เดือน">รายเดือน</option>
                          <option value="เทอม">รายเทอม</option>
                        </select>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:shadow-md transition-all duration-300"
                  >
                    {editingTenant ? "อัปเดตข้อมูล" : "เพิ่มผู้เช่า"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Confirm Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 transform transition-all scale-95 animate-fadeIn">
            <div className="flex items-center mb-4">
              <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full mr-3">
                <i className="fas fa-exclamation-triangle text-yellow-500 text-xl"></i>
              </div>
              <h3 className="text-lg font-bold font-kanit text-gray-800">
                ยืนยันการดำเนินการ
              </h3>
            </div>

            <p className="text-gray-600 mb-6">{confirmModal.message}</p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={closeConfirmModal}
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition-all"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => {
                  confirmModal.onConfirm();
                  closeConfirmModal();
                }}
                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-all"
              >
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default OwnerTenant;

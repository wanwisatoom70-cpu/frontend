// src/pages/OwnerRooms.jsx
import React, { useEffect, useState, useCallback } from "react";
import API from "../api";
import Layout from "../components/Layout";

const OwnerRooms = () => {
  const [rooms, setRooms] = useState([]);
  const [properties, setProperties] = useState([]);
  const [form, setForm] = useState({
    property_id: "",
    name: "",
    code: "",
    price_monthly: "",
    price_term: "",
    has_ac: 0,
    has_fan: 0,
    deposit: "",
    description: "",
    images: "", // URL string
    imageFiles: [], // ไฟล์จากเครื่อง
  });
  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterProperty, setFilterProperty] = useState("all");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [gallery, setGallery] = useState({
    open: false,
    images: [],
    currentIndex: 0,
    roomName: "",
  });
  // แปลง image path ให้เป็น URL ที่ใช้ได้
  const getImageUrl = (img) => {
    if (!img) return "/default-room.jpg"; // ถ้าไม่มีรูป
    return img.startsWith("http") ? img : `http://localhost:5000${img}`;
  };

  // สำหรับ array ของ images
  const getImageUrls = (images) => {
    if (!images) return ["/default-room.jpg"];
    return Array.isArray(images)
      ? images.filter(Boolean).map(getImageUrl)
      : [getImageUrl(images)];
  };
  const appendFiles = (formData, files, fieldName = "imageFiles") => {
    if (!files || !files.length) return;
    files.forEach((file) => formData.append(fieldName, file));
  };

  const openGallery = (room, index = 0) => {
    const imgs = getImageUrls(room.images);
    setGallery({
      open: true,
      images: imgs,
      currentIndex: index,
      roomName: room.name,
    });
  };

  const closeGallery = () => {
    setGallery({ open: false, images: [], currentIndex: 0, roomName: "" });
  };

  const nextImage = () => {
    setGallery((prev) => ({
      ...prev,
      currentIndex: (prev.currentIndex + 1) % prev.images.length,
    }));
  };

  const prevImage = () => {
    setGallery((prev) => ({
      ...prev,
      currentIndex:
        (prev.currentIndex - 1 + prev.images.length) % prev.images.length,
    }));
  };

  // ✅ ห่อ showToast ด้วย useCallback
  const showToast = useCallback((message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "" });
    }, 3000);
  }, []);

  // แก้ไข fetchRooms เพื่อดึงข้อมูลการจองและคำขอซ่อมแซมด้วย
  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get("/rooms/rooms/my");
      setRooms(res.data);
    } catch (err) {
      console.error(err);
      showToast("เกิดข้อผิดพลาดในการดึงข้อมูล", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const fetchProperties = useCallback(async () => {
    try {
      const res = await API.get("/properties/my");
      setProperties(res.data);
    } catch (err) {
      console.error(err);
      showToast("เกิดข้อผิดพลาดในการดึงข้อมูลอสังหาริมทรัพย์", "error");
    }
  }, [showToast]);

  useEffect(() => {
    fetchRooms();
    fetchProperties();
  }, [fetchRooms, fetchProperties]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("property_id", form.property_id);
      formData.append("name", form.name);
      formData.append("code", form.code);
      formData.append("price_monthly", form.price_monthly);
      formData.append("price_term", form.price_term);
      formData.append("has_ac", form.has_ac);
      formData.append("has_fan", form.has_fan);
      formData.append("deposit", form.deposit);
      formData.append("description", form.description);
      formData.append("images", form.images || ""); // URL string

      // ✅ append files safely
      appendFiles(formData, form.imageFiles);

      if (editingId) {
        await API.put(`/rooms/${editingId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showToast("อัปเดตข้อมูลห้องพักสำเร็จ", "success");
        setEditingId(null);
      } else {
        await API.post("/rooms", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showToast("เพิ่มห้องพักสำเร็จ", "success");
      }

      setForm({
        property_id: "",
        name: "",
        code: "",
        price_monthly: "",
        price_term: "",
        has_ac: 0,
        has_fan: 0,
        deposit: "",
        description: "",
        images: "",
        imageFiles: [],
      });
      setModalOpen(false);
      fetchRooms();
    } catch (err) {
      console.error(err);
      showToast(
        err.response?.data?.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
        "error"
      );
    }
  };

  const handleEdit = (room) => {
    setEditingId(room.id);
    setForm({
      ...room,
      property_id: room.property_id ?? "", // ถ้า null ให้เป็น ""
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/rooms/${id}`);
      showToast("ลบห้องพักสำเร็จ", "success");
      setConfirmDelete(null);
      fetchRooms();
    } catch (err) {
      console.error(err);
      showToast(
        err.response?.data?.message || "เกิดข้อผิดพลาดในการลบข้อมูล",
        "error"
      );
    }
  };

  const openModal = () => {
    setForm({
      property_id: "",
      name: "",
      code: "",
      price_monthly: "",
      price_term: "",
      has_ac: 0,
      has_fan: 0,
      deposit: "",
      description: "",
      images: "",
    });
    setEditingId(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const filteredRooms = rooms
    .filter((room) => {
      const matchesSearch =
        room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesProperty =
        filterProperty === "all" || room.property_id == filterProperty;
      return matchesSearch && matchesProperty;
    })
    .sort((a, b) => {
      // เรียงตาม property_id ก่อน
      if (a.property_id !== b.property_id) {
        return a.property_id - b.property_id;
      }
      // ถ้า property เดียวกัน เรียงตามชื่อห้อง
      return a.code.localeCompare(b.code, "th"); // ใช้ locale ไทย
    });

  const getPropertyName = (propertyId) => {
    const property = properties.find((p) => p.id == propertyId);
    return property ? property.name : "ไม่ทราบ";
  };

  // ฟังก์ชันสำหรับแปลงสถานะห้องเป็นข้อความ
  const getRoomStatusText = (status) => {
    switch (status) {
      case "available":
        return "ว่าง";
      case "pending":
        return "รอการยืนยัน";
      case "occupied":
        return "ไม่ว่าง";
      case "maintenance":
        return "ซ่อมแซม";
      case "occupied_maintenance":
        return "ไม่ว่าง/ซ่อมแซม";
      case "maintenance_pending":
        return "ซ่อมแซม + รอการยืนยัน";
      case "occupied_maintenance_pending":
        return "ไม่ว่าง/ซ่อมแซม + รอการยืนยัน";
      default:
        return "ไม่ทราบสถานะ";
    }
  };

  // ฟังก์ชันสำหรับเลือกสีตามสถานะห้อง
  const getRoomStatusColor = (status) => {
    switch (status) {
      case "available":
        return "bg-green-500";
      case "pending":
        return "bg-blue-400";
      case "occupied":
        return "bg-red-500";
      case "maintenance":
        return "bg-yellow-500";
      case "occupied_maintenance":
        return "bg-orange-500";
      case "maintenance_pending":
        return "bg-purple-500";
      case "occupied_maintenance_pending":
        return "bg-pink-600";
      default:
        return "bg-gray-500";
    }
  };

  // ฟังก์ชันสำหรับจัดรูปแบบวันที่
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Layout showFooter={false} showNav={false}>
      {/* Toast Notification */}
      {toast.show && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white transform transition-all duration-300 ${
            toast.type === "success" ? "bg-green-500" : "bg-red-500"
          } animate-fadeInDown`}
        >
          <div className="flex items-center">
            <i
              className={`fas ${
                toast.type === "success"
                  ? "fa-check-circle"
                  : "fa-exclamation-circle"
              } mr-2`}
            ></i>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Sticky Header with Gradient Background */}
      <div className="sticky top-0 z-10 bg-orange-400 text-white shadow-lg pb-4 pt-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-kanit mb-1">
                จัดการห้องพัก
              </h1>
              <p className="text-indigo-100 text-sm">
                เพิ่ม แก้ไข และลบห้องพักของคุณ
              </p>
            </div>
            <button
              onClick={openModal}
              className="mt-3 sm:mt-0 bg-white text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center shadow-md hover:shadow-lg"
            >
              <i className="fas fa-plus mr-2"></i> เพิ่มห้องพักใหม่
            </button>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="ค้นหาห้องพัก..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-800"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute left-3 top-2.5 text-gray-400">
                <i className="fas fa-search"></i>
              </div>
            </div>
            <div className="w-full md:w-64">
              <select
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-800"
                value={filterProperty}
                onChange={(e) => setFilterProperty(e.target.value)}
              >
                <option value="all">ทุกอสังหาริมทรัพย์</option>
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-h-[calc(94vh-120px)] overflow-y-auto bg-orange-50 p-4 md:p-6">
        {/* ส่วนแสดงรายการห้อง */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl shadow-lg">
            <div className="text-indigo-500 mb-4">
              <i className="fas fa-door-closed text-5xl"></i>
            </div>
            <h3 className="text-xl font-bold font-kanit mb-2">
              {searchTerm || filterProperty !== "all"
                ? "ไม่พบห้องพักที่ค้นหา"
                : "ยังไม่มีห้องพัก"}
            </h3>
            <p className="text-gray-600 mb-6 max-w-md text-center">
              {searchTerm || filterProperty !== "all"
                ? "ลองค้นหาด้วยเงื่อนไขอื่น"
                : "เริ่มต้นโดยการเพิ่มห้องพักแรกของคุณ"}
            </p>
            {!searchTerm && filterProperty === "all" && (
              <button
                onClick={openModal}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-full font-medium hover:shadow-lg transition-all duration-300 flex items-center"
              >
                <i className="fas fa-plus mr-2"></i> เพิ่มห้องพักใหม่
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRooms.map((r) => {
              return (
                <div
                  key={r.id}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1"
                >
                  {/* Room Image */}
                  <div className="h-48 overflow-hidden relative">
                    <img
                      src={getImageUrls(r.images)[0]}
                      alt={r.name}
                      onClick={() => openGallery(r)}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-110 cursor-pointer"
                    />
                    {/* Status Badge */}
                    <div className="absolute top-2 left-2">
                      <span
                        className={`${getRoomStatusColor(
                          r.status
                        )} text-white text-xs px-2 py-1 rounded-full`}
                      >
                        {getRoomStatusText(r.status)}
                      </span>
                    </div>
                  </div>

                  {/* Room Details */}
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-xl font-bold font-kanit text-gray-800">
                          {r.name}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          รหัสห้อง : {r.code}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(r)}
                          className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 hover:bg-yellow-200 transition-colors duration-200"
                          title="แก้ไข"
                        >
                          <i className="fas fa-edit text-sm"></i>
                        </button>
                        <button
                          onClick={() => setConfirmDelete(r)}
                          className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 hover:bg-red-200 transition-colors duration-200"
                          title="ลบ"
                        >
                          <i className="fas fa-trash-alt text-sm"></i>
                        </button>
                      </div>
                    </div>

                    <div className="mb-3">
                      <p className="text-gray-600 text-sm flex items-center">
                        <i className="fas fa-building mr-2 text-indigo-500"></i>
                        {getPropertyName(r.property_id)} 
                      </p>
                    </div>

                    {r.tenants && r.tenants.length > 0 ? (
                      <div className="mb-3 bg-blue-50 p-3 rounded-lg">
                        <p className="text-sm font-medium text-blue-800 mb-1">
                          <i className="fas fa-user mr-1"></i> ผู้เช่าปัจจุบัน
                        </p>
                        {r.tenants.map((tenant, index) => (
                          <div key={index} className="mb-2 last:mb-0">
                            <p className="text-sm text-blue-700 font-medium">
                              {tenant.tenantName}
                            </p>
                            <p className="text-xs text-blue-600 mt-1">
                              {formatDate(tenant.startDate)} -{" "}
                              {formatDate(tenant.endDate)}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : r.tenantInfo ? (
                      <div className="mb-3 bg-blue-50 p-3 rounded-lg">
                        <p className="text-sm font-medium text-blue-800 mb-1">
                          <i className="fas fa-user mr-1"></i> ผู้เช่าปัจจุบัน
                        </p>
                        <p className="text-sm text-blue-700 font-medium">
                          {r.tenantInfo.tenantName}
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          {formatDate(r.tenantInfo.startDate)} -{" "}
                          {formatDate(r.tenantInfo.endDate)}
                        </p>
                      </div>
                    ) : null}

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">ราคา/เดือน</p>
                        <p className="text-lg font-bold text-blue-600">
                          ฿
                          {r.price_monthly != null
                            ? Number(r.price_monthly).toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })
                            : "-"}
                        </p>
                      </div>
                      <div className="bg-purple-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">ราคา/เทอม</p>
                        <p className="text-lg font-bold text-purple-600">
                          ฿
                          {r.price_term != null
                            ? Number(r.price_term).toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })
                            : "-"}
                        </p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        ประเภทห้อง
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {r.has_ac == 1 && (
                          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium flex items-center">
                            <i className="fas fa-snowflake mr-1"></i> แอร์
                          </span>
                        )}
                        {r.has_fan == 1 && (
                          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium flex items-center">
                            <i className="fas fa-fan mr-1"></i> พัดลม
                          </span>
                        )}
                        {r.has_ac != 1 && r.has_fan != 1 && (
                          <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-xs">
                            ไม่มีสิ่งอำนวยความสะดวกพิเศษ
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        รายละเอียด
                      </p>
                      <p className="text-gray-600 text-sm line-clamp-2">
                        {r.description || "ไม่มีรายละเอียด"}
                      </p>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="text-xs text-gray-500">
                        {/* ID: {r.id} */}
                        ราคาประกัน:{" "}
                        {r.deposit != null
                          ? Number(r.deposit).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })
                          : "-"}
                      </div>
                      <button
                        onClick={() => openGallery(r)}
                        className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center"
                      >
                        ดูรูปภาพ <i className="fas fa-images ml-1"></i>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-95 animate-scaleIn">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold font-kanit">
                  {editingId ? "แก้ไขห้องพัก" : "เพิ่มห้องพักใหม่"}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      อสังหาริมทรัพย์
                    </label>
                    <select
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      value={form.property_id}
                      onChange={(e) =>
                        setForm({ ...form, property_id: e.target.value })
                      }
                      required
                    >
                      <option value="">เลือกอสังหาริมทรัพย์</option>
                      {properties.map((property) => (
                        <option key={property.id} value={property.id}>
                          {property.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ราคา/เดือน
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500">฿</span>
                      </div>
                      <input
                        type="number"
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        value={form.price_monthly}
                        onChange={(e) =>
                          setForm({ ...form, price_monthly: e.target.value })
                        }
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ชื่อห้อง
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ราคา/เทอม
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500">฿</span>
                      </div>
                      <input
                        type="number"
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        value={form.price_term}
                        onChange={(e) =>
                          setForm({ ...form, price_term: e.target.value })
                        }
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                  {/* <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      รหัสห้อง
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      value={form.code}
                      onChange={(e) =>
                        setForm({ ...form, code: e.target.value })
                      }
                      required
                    />
                  </div> */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ประเภทห้อง
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          checked={form.has_ac == 1}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              has_ac: e.target.checked ? 1 : 0,
                            })
                          }
                        />
                        <span className="ml-2 text-sm text-gray-700">แอร์</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          checked={form.has_fan == 1}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              has_fan: e.target.checked ? 1 : 0,
                            })
                          }
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          พัดลม
                        </span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ราคาประกัน
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500">฿</span>
                      </div>
                      <input
                        type="number"
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        value={form.deposit}
                        onChange={(e) =>
                          setForm({ ...form, deposit: e.target.value })
                        }
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      รูปภาพ URL (คั่นด้วยเครื่องหมาย ,)
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      value={form.images}
                      onChange={(e) =>
                        setForm({ ...form, images: e.target.value })
                      }
                      placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                    />
                  </div>

                  <div className="md:col-span-2 mt-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      อัพโหลดรูปภาพ (สามารถเลือกหลายไฟล์)
                    </label>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) =>
                        setForm({
                          ...form,
                          imageFiles: Array.from(e.target.files),
                        })
                      }
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      รายละเอียด
                    </label>
                    <textarea
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      value={form.description}
                      onChange={(e) =>
                        setForm({ ...form, description: e.target.value })
                      }
                      rows="3"
                    ></textarea>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:shadow-md transition-all duration-300 flex items-center"
                  >
                    <i className="fas fa-save mr-2"></i>
                    {editingId ? "อัปเดต" : "บันทึก"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md transform transition-all duration-300 scale-95 animate-scaleIn">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mr-4">
                  <i className="fas fa-exclamation-triangle text-red-500 text-xl"></i>
                </div>
                <h2 className="text-xl font-bold font-kanit">ยืนยันการลบ</h2>
              </div>
              <p className="text-gray-600 mb-6">
                คุณแน่ใจหรือไม่ที่จะลบห้องพัก{" "}
                <span className="font-bold text-gray-800">
                  {confirmDelete.name}
                </span>
                ?
                <br />
                <span className="text-sm text-gray-500">
                  การดำเนินการนี้ไม่สามารถย้อนกลับได้
                </span>
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={() => handleDelete(confirmDelete.id)}
                  className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg font-medium hover:shadow-md transition-all duration-300"
                >
                  ลบ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gallery Modal */}
      {gallery.open && (
        <div className="fixed inset-0 bg-black bg-opacity-90 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300">
          {/* ปุ่มปิด */}
          <button
            onClick={closeGallery}
            className="absolute top-6 right-6 z-50 w-10 h-10 rounded-full bg-white bg-opacity-10 backdrop-blur-md flex items-center justify-center text-white hover:bg-opacity-20 transition-all duration-300 group"
          >
            <i className="fas fa-times text-xl group-hover:rotate-90 transition-transform duration-300"></i>
          </button>
          {gallery.images.length > 0 ? (
            <div className="flex flex-col items-center w-full max-w-6xl px-4">
              {/* ชื่อห้องและจำนวนรูป */}
              <div className="flex justify-between items-center w-full mb-4">
                <h3 className="text-white text-xl md:text-2xl font-bold font-kanit">
                  {gallery.roomName}
                </h3>
                <div className="bg-white bg-opacity-10 backdrop-blur-sm px-3 py-1 rounded-full text-white text-sm">
                  {gallery.currentIndex + 1} / {gallery.images.length}
                </div>
              </div>
              {/* แถบแสดงตำแหน่งรูปภาพ */}
              <div className="flex justify-center space-x-2 mb-6 w-full">
                {gallery.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() =>
                      setGallery({ ...gallery, currentIndex: index })
                    }
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === gallery.currentIndex
                        ? "bg-white w-8"
                        : "bg-white bg-opacity-30 hover:bg-opacity-50"
                    }`}
                    aria-label={`ดูรูปที่ ${index + 1}`}
                  />
                ))}
              </div>
              {/* รูปภาพหลัก */}
              <div className="relative w-full flex items-center justify-center">
                {/* ปุ่มย้อนกลับ */}
                <button
                  onClick={prevImage}
                  className="absolute left-0 md:left-6 z-10 w-12 h-12 rounded-full bg-white bg-opacity-10 backdrop-blur-md flex items-center justify-center text-white hover:bg-opacity-20 transition-all duration-300 group -ml-6 md:ml-0"
                >
                  <i className="fas fa-chevron-left text-xl group-hover:-translate-x-1 transition-transform duration-300"></i>
                </button>
                {/* รูปภาพ */}
                <div
                  className="relative flex items-center justify-center"
                  style={{ height: "70vh" }}
                >
                  <img
                    src={gallery.images[gallery.currentIndex]}
                    alt={`${gallery.roomName} - รูปที่ ${
                      gallery.currentIndex + 1
                    }`}
                    className="h-full w-auto max-w-full object-contain rounded-xl shadow-2xl transform transition-transform duration-500"
                  />
                  {/* ข้อมูลรูปภาพ */}
                  <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 backdrop-blur-sm px-4 py-2 rounded-lg text-white">
                    <p className="text-sm">รูปที่ {gallery.currentIndex + 1}</p>
                  </div>
                </div>
                {/* ปุ่มถัดไป */}
                <button
                  onClick={nextImage}
                  className="absolute right-0 md:right-6 z-10 w-12 h-12 rounded-full bg-white bg-opacity-10 backdrop-blur-md flex items-center justify-center text-white hover:bg-opacity-20 transition-all duration-300 group -mr-6 md:mr-0"
                >
                  <i className="fas fa-chevron-right text-xl group-hover:translate-x-1 transition-transform duration-300"></i>
                </button>
              </div>
              {/* ตัวบอกจำนวนรูปภาพแบบ mobile */}
              <div className="md:hidden flex justify-center space-x-1 mt-6">
                {gallery.images.map((_, index) => (
                  <div
                    key={index}
                    className={`w-1.5 h-1.5 rounded-full ${
                      index === gallery.currentIndex
                        ? "bg-white"
                        : "bg-white bg-opacity-30"
                    }`}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-white p-8">
              <div className="w-24 h-24 rounded-full bg-white bg-opacity-10 backdrop-blur-md flex items-center justify-center mb-4">
                <i className="fas fa-image text-3xl text-white text-opacity-50"></i>
              </div>
              <p className="text-xl">ไม่มีรูปภาพ</p>
              <p className="text-white text-opacity-50 mt-2">
                ไม่พบรูปภาพสำหรับห้องนี้
              </p>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
};

export default OwnerRooms;

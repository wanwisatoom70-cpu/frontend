// pages/OwnerProperties.jsx
import React, { useEffect, useState, useCallback } from "react";
import API from "../api";
import Layout from "../components/Layout";

const OwnerProperties = () => {
  const [properties, setProperties] = useState([]);
  const [form, setForm] = useState({
    name: "",
    address: "",
    image: "", // URL
    file: null, // ไฟล์อัปโหลด
    description: "",
    electric_rate: "",
    water_rate: "",
  });

  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nameExists, setNameExists] = useState(false);
  const [checkingName, setCheckingName] = useState(false);
  const [errors, setErrors] = useState({});

  // ฟังก์ชันสำหรับแสดง Toast Notification
  const showToast = useCallback((message, type = "success") => {
    setToast({ show: true, message, type });

    // ซ่อน toast หลังจาก 3 วินาที
    setTimeout(() => {
      setToast({ show: false, message: "", type: "" });
    }, 3000);
  }, []);

  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get("/properties/my");
      setProperties(res.data);
    } catch (err) {
      console.error(err);
      showToast("เกิดข้อผิดพลาดในการดึงข้อมูล", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const checkDuplicateName = useCallback(
    async (name) => {
      if (!name.trim()) {
        setNameExists(false);
        return;
      }

      try {
        setCheckingName(true);

        const res = await API.get("/properties/check-name", {
          params: {
            name,
            id: editingId || undefined, // ถ้าแก้ไข จะไม่เช็คตัวเอง
          },
        });

        setNameExists(res.data.exists);
      } catch (err) {
        console.error("check name error:", err);
      } finally {
        setCheckingName(false);
      }
    },
    [editingId],
  );

  useEffect(() => {
    const delay = setTimeout(() => {
      checkDuplicateName(form.name);
    }, 500);

    return () => clearTimeout(delay);
  }, [form.name, checkDuplicateName]);

  const validateForm = () => {
    const newErrors = {};

    if (!form.name.trim()) newErrors.name = "กรุณากรอกชื่ออสังหาริมทรัพย์";
    if (!form.address.trim()) newErrors.address = "กรุณากรอกที่อยู่";
    if (!form.description.trim()) newErrors.description = "กรุณากรอกรายละเอียด";
    if (!form.electric_rate) newErrors.electric_rate = "กรุณากรอกค่าไฟฟ้า";
    if (!form.water_rate) newErrors.water_rate = "กรุณากรอกค่าน้ำ";

    // กรณีเพิ่มใหม่ต้องมีรูป
    if (!editingId && !form.file && !form.image)
      newErrors.image = "กรุณาอัปโหลดรูปภาพ";
    if (parseFloat(form.electric_rate) <= 0)
      newErrors.electric_rate = "ค่าไฟต้องมากกว่า 0";

    if (parseFloat(form.water_rate) <= 0)
      newErrors.water_rate = "ค่าน้ำต้องมากกว่า 0";

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast("กรุณากรอกข้อมูลให้ครบถ้วน", "error");
      return;
    }

    if (nameExists) {
      showToast("ชื่ออสังหาริมทรัพย์นี้ถูกใช้แล้ว", "error");
      return;
    }
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("address", form.address);
      formData.append("description", form.description);
      formData.append("electric_rate", form.electric_rate);
      formData.append("water_rate", form.water_rate);

      if (form.file) {
        formData.append("imageFile", form.file);
      } else {
        formData.append("image", form.image);
      }

      if (editingId) {
        await API.put(`/properties/edit/${editingId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showToast("อัปเดตข้อมูลอสังหาริมทรัพย์สำเร็จ", "success");
        setEditingId(null);
      } else {
        await API.post("/properties/add", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showToast("เพิ่มอสังหาริมทรัพย์สำเร็จ", "success");
      }

      setForm({
        name: "",
        address: "",
        image: "",
        file: null,
        description: "",
        electric_rate: "",
        water_rate: "",
      });
      setModalOpen(false);
      fetchProperties();
    } catch (err) {
      console.error(err);
      showToast(
        err.response?.data?.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
        "error",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (property) => {
    setEditingId(property.id);
    setErrors({}); // ✅ เพิ่ม
    setNameExists(false); // ✅ เพิ่ม

    setForm({
      name: property.name || "",
      address: property.address || "",
      image: property.image || "",
      file: null,
      description: property.description || "",
      electric_rate: property.priceElectric?.toString() ?? "",
      water_rate: property.priceWater?.toString() ?? "",
    });

    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/properties/${id}`);
      showToast("ลบอสังหาริมทรัพย์สำเร็จ", "success");
      setConfirmDelete(null);
      fetchProperties();
    } catch (err) {
      if (err.response?.data?.reasons) {
        const r = err.response.data.reasons;
        let msg = "ไม่สามารถลบได้ เนื่องจากยังมี:\n";

        if (r.staff) msg += `- พนักงาน ${r.staff} คน\n`;
        if (r.rooms) msg += `- ห้อง ${r.rooms} ห้อง\n`;
        if (r.bookings) msg += `- การเช่า/จอง ${r.bookings} รายการ\n`;

        showToast(msg, "error");
      } else {
        showToast(
          err.response?.data?.message || "เกิดข้อผิดพลาดในการลบข้อมูล",
          "error",
        );
      }
    }
  };

  const openModal = () => {
    setForm({
      name: "",
      address: "",
      image: "",
      file: null,
      description: "",
      electric_rate: "",
      water_rate: "",
    });
    setEditingId(null);
    setErrors({}); // ✅
    setNameExists(false); // ✅ กันชื่อซ้ำค้าง
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setErrors({}); // ✅ ล้าง error ทุกครั้งที่ปิด
    setNameExists(false); // ✅ ล้างชื่อซ้ำ
  };

  const openDetailModal = (property) => {
    setSelectedProperty(property);
    setDetailModalOpen(true);
  };

  const closeDetailModal = () => {
    setDetailModalOpen(false);
    setSelectedProperty(null);
  };

  const filteredProperties = properties.filter(
    (property) =>
      property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.address.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleRateChange = (e, field) => {
    let value = e.target.value;

    // อนุญาตเฉพาะตัวเลข + จุดทศนิยม
    if (!/^\d*\.?\d{0,2}$/.test(value)) return;

    // ❌ กัน 0 นำหน้า (ยกเว้น 0.x)
    if (/^0\d+/.test(value)) return;

    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    // ลบ error ถ้ามี
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
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
      <div className="sticky top-0 z-10 bg-pink-400 text-white shadow-lg pb-4 pt-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-kanit mb-1">
                จัดการอสังหาริมทรัพย์
              </h1>
              <p className="text-indigo-100 text-sm">
                เพิ่ม แก้ไข และลบอสังหาริมทรัพย์ของคุณ
              </p>
            </div>
            <button
              onClick={openModal}
              className="mt-3 sm:mt-0 bg-white text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center shadow-md hover:shadow-lg"
            >
              <i className="fas fa-plus mr-2"></i> เพิ่มอสังหาริมทรัพย์ใหม่
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="ค้นหาอสังหาริมทรัพย์..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border-0 text-gray-800 focus:ring-2 focus:ring-white focus:ring-opacity-50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute left-3 top-2.5 text-white text-opacity-70">
              <i className="fas fa-search"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-pink-50 p-4 md:p-6">
        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse"
              >
                <div className="h-48 bg-gray-200"></div>
                <div className="p-5">
                  <div className="h-6 w-3/4 bg-gray-200 rounded mb-3"></div>
                  <div className="h-4 w-full bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 w-5/6 bg-gray-200 rounded mb-4"></div>
                  <div className="flex justify-end space-x-2">
                    <div className="h-8 w-16 bg-gray-200 rounded"></div>
                    <div className="h-8 w-16 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl shadow-lg">
            <div className="text-indigo-500 mb-4">
              <i className="fas fa-building text-5xl"></i>
            </div>
            <h3 className="text-xl font-bold font-kanit mb-2">
              {searchTerm
                ? "ไม่พบอสังหาริมทรัพย์ที่ค้นหา"
                : "ยังไม่มีอสังหาริมทรัพย์"}
            </h3>
            <p className="text-gray-600 mb-6 max-w-md text-center">
              {searchTerm
                ? "ลองค้นหาด้วยคำอื่นหรือตรวจสอบการสะกด"
                : "เริ่มต้นโดยการเพิ่มอสังหาริมทรัพย์แรกของคุณ"}
            </p>
            {!searchTerm && (
              <button
                onClick={openModal}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-full font-medium hover:shadow-lg transition-all duration-300 flex items-center"
              >
                <i className="fas fa-plus mr-2"></i> เพิ่มอสังหาริมทรัพย์ใหม่
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1"
              >
                {/* Property Image */}
                <div className="h-48 overflow-hidden relative">
                  <img
                    src={
                      p.image
                        ? p.image.startsWith("http")
                          ? p.image
                          : `${import.meta.env.VITE_API_URL}${p.image}`
                        : "/default-dorm.jpg"
                    }
                    alt={p.name}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                  />
                  {/* Rating Badge */}
                  {p.rating && (
                    <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
                      <i className="fas fa-star mr-1"></i> {p.rating}
                    </div>
                  )}
                </div>

                {/* Property Details */}
                <div className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-bold font-kanit text-gray-800">
                      {p.name}
                    </h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(p)}
                        className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 hover:bg-yellow-200 transition-colors duration-200"
                        title="แก้ไข"
                      >
                        <i className="fas fa-edit text-sm"></i>
                      </button>
                      <button
                        onClick={() => setConfirmDelete(p)}
                        className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 hover:bg-red-200 transition-colors duration-200"
                        title="ลบ"
                      >
                        <i className="fas fa-trash-alt text-sm"></i>
                      </button>
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-gray-600 text-sm flex items-start">
                      <i className="fas fa-map-marker-alt mr-2 text-indigo-500 mt-1"></i>
                      {p.address}
                    </p>
                  </div>

                  <div className="mb-4">
                    <p className="text-gray-700 text-sm line-clamp-2">
                      {p.description || "ไม่มีรายละเอียด"}
                    </p>
                  </div>

                  <div className="flex justify-between items-center">
                    {/* <div className="text-xs text-gray-500">ลำดับ: {p.id}</div> */}
                    <button
                      onClick={() => openDetailModal(p)}
                      className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center"
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

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-95 animate-scaleIn">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold font-kanit">
                  {editingId
                    ? "แก้ไขอสังหาริมทรัพย์"
                    : "เพิ่มอสังหาริมทรัพย์ใหม่"}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ชื่ออสังหาริมทรัพย์
                  </label>
                  <input
                    type="text"
                    className={`w-full p-2 border rounded-lg focus:ring-2 ${
                      nameExists
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                    }`}
                    value={form.name ?? ""}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                  {checkingName && (
                    <p className="text-xs text-gray-500 mt-1">
                      <i className="fas fa-spinner fa-spin mr-1"></i>
                      กำลังตรวจสอบชื่อ...
                    </p>
                  )}

                  {nameExists && (
                    <p className="text-xs text-red-500 mt-1">
                      <i className="fas fa-exclamation-circle mr-1"></i>
                      ชื่ออสังหาริมทรัพย์นี้ถูกใช้แล้ว
                    </p>
                  )}
                  {errors.name && (
                    <p className="text-xs text-red-500 mt-1">
                      <i className="fas fa-exclamation-circle mr-1"></i>
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ที่อยู่
                  </label>
                  <textarea
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={form.address ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, address: e.target.value })
                    }
                    rows="2"
                    required
                  />
                  {errors.address && (
                    <p className="text-xs text-red-500 mt-1">
                      <i className="fas fa-exclamation-circle mr-1"></i>
                      {errors.address}
                    </p>
                  )}
                </div>

                {/* Image Upload Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    รูปภาพ
                  </label>

                  {/* File Input */}
                  <input
                    type="file"
                    accept="image/*"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mb-2"
                    onChange={(e) => {
                      const selectedFile = e.target.files[0];

                      setForm({
                        ...form,
                        file: selectedFile,
                        image: selectedFile
                          ? URL.createObjectURL(selectedFile)
                          : "",
                      });

                      // ✅ ลบ error image ทันทีเมื่อเลือกรูป
                      if (errors.image) {
                        setErrors((prev) => ({
                          ...prev,
                          image: undefined,
                        }));
                      }
                    }}
                  />
                  {errors.image && (
                    <p className="text-xs text-red-500 mt-1">
                      <i className="fas fa-exclamation-circle mr-1"></i>
                      {errors.image}
                    </p>
                  )}

                  {/* Image Preview */}
                  {form.image && (
                    <div className="mt-2">
                      <img
                        src={
                          form.image.startsWith("/uploads")
                            ? `${import.meta.env.VITE_API_URL}${form.image}`
                            : form.image || "/default-dorm.jpg"
                        }
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg shadow-md"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "/default-dorm.jpg";
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    รายละเอียด
                  </label>
                  <textarea
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={form.description}
                    onChange={(e) => {
                      setForm({ ...form, description: e.target.value });

                      if (errors.description) {
                        setErrors({ ...errors, description: undefined });
                      }
                    }}
                    rows="3"
                  />
                  {errors.description && (
                    <p className="text-xs text-red-500 mt-1">
                      <i className="fas fa-exclamation-circle mr-1"></i>
                      {errors.description}
                    </p>
                  )}
                </div>

                {/* Electric / Water Rate */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ค่าไฟฟ้า (บาท/หน่วย)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={form.electric_rate ?? ""}
                    onChange={(e) => handleRateChange(e, "electric_rate")}
                    required
                  />
                  {errors.electric_rate && (
                    <p className="text-xs text-red-500 mt-1">
                      <i className="fas fa-exclamation-circle mr-1"></i>
                      {errors.electric_rate}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ค่าน้ำ (บาท/หน่วย)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={form.water_rate ?? ""}
                    onChange={(e) => handleRateChange(e, "water_rate")}
                    required
                  />
                  {errors.water_rate && (
                    <p className="text-xs text-red-500 mt-1">
                      <i className="fas fa-exclamation-circle mr-1"></i>
                      {errors.water_rate}
                    </p>
                  )}
                </div>

                {/* Buttons */}
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
                    disabled={isSubmitting || nameExists}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                      isSubmitting || nameExists
                        ? "bg-gray-400 text-white cursor-not-allowed"
                        : "bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:shadow-md"
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        {editingId ? "กำลังอัปเดต..." : "กำลังบันทึก..."}
                      </>
                    ) : editingId ? (
                      "อัปเดต"
                    ) : (
                      "บันทึก"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal - Enhanced Version */}
      {detailModalOpen && selectedProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col transform transition-all duration-300 scale-95 animate-fadeInUp">
            {/* Header with Close Button */}
            <div className="p-6 flex-shrink-0 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold font-kanit text-gray-800">
                  รายละเอียดอสังหาริมทรัพย์
                </h2>
                <button
                  onClick={closeDetailModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <i className="fas fa-times text-2xl"></i>
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="px-6 py-4 overflow-y-auto flex-grow">
              <div className="mb-6">
                {/* Property Image with Zoom Effect */}
                <div className="relative rounded-xl overflow-hidden mb-4 group">
                  <img
                    src={
                      selectedProperty.image
                        ? selectedProperty.image.startsWith("http")
                          ? selectedProperty.image
                          : `${import.meta.env.VITE_API_URL}${selectedProperty.image}`
                        : "/default-dorm.jpg"
                    }
                    alt={selectedProperty.name}
                    className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute bottom-3 right-3 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                    <i className="fas fa-camera mr-1"></i> รูปภาพ
                  </div>
                </div>

                {/* Property Info Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start mb-4">
                  <div className="mb-3 sm:mb-0">
                    <h3 className="text-2xl font-bold font-kanit text-gray-800 mb-1">
                      {selectedProperty.name}
                    </h3>
                    <div className="flex items-center text-gray-600">
                      <i className="fas fa-map-marker-alt mr-2 text-indigo-500"></i>
                      <span className="line-clamp-2">
                        {selectedProperty.address}
                      </span>
                    </div>
                  </div>

                  {/* Rating Badge with Icon */}
                  {selectedProperty.avgRating && (
                    <div className="bg-yellow-100 text-yellow-800 px-3 py-1.5 rounded-full flex items-center">
                      <i className="fas fa-star text-yellow-500 mr-1"></i>
                      <span className="font-medium">
                        {selectedProperty.avgRating}
                      </span>
                      <span className="text-xs ml-1 opacity-75">/5</span>
                    </div>
                  )}
                </div>

                {/* Property Description */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                    <i className="fas fa-info-circle text-blue-500 mr-2"></i>
                    รายละเอียด
                  </h4>
                  <p className="text-gray-600 leading-relaxed">
                    {selectedProperty.description || "ไม่มีรายละเอียด"}
                  </p>
                </div>

                {/* Price Information with Icons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <i className="fas fa-bolt text-yellow-500 mr-2"></i>
                      <span className="text-sm text-gray-600">ค่าไฟฟ้า</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      {selectedProperty.priceElectric || "-"} บาท/หน่วย
                    </div>
                  </div>
                  <div className="bg-teal-50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <i className="fas fa-tint text-blue-500 mr-2"></i>
                      <span className="text-sm text-gray-600">ค่าน้ำ</span>
                    </div>
                    <div className="text-2xl font-bold text-teal-600">
                      {selectedProperty.priceWater || "-"} บาท/หน่วย
                    </div>
                  </div>
                </div>

                {/* Additional Stats with Icons */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <i className="fas fa-bed text-purple-500 mr-2"></i>
                      <span className="text-sm text-gray-600">จำนวนห้อง</span>
                    </div>
                    <div className="text-xl font-bold text-purple-600">
                      {selectedProperty.roomsCount || 0} ห้อง
                    </div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <i className="fas fa-users text-green-500 mr-2"></i>
                      <span className="text-sm text-gray-600">
                        จำนวนผู้เช่า
                      </span>
                    </div>
                    <div className="text-xl font-bold text-green-600">
                      {selectedProperty.tenantsCount || 0} คน
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons Footer */}
            <div className="p-6 bg-gray-50 rounded-b-2xl border-t border-gray-100">
              <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <i className="fas fa-tools text-gray-500 mr-2"></i>
                จัดการอสังหาริมทรัพย์
              </h4>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    closeDetailModal();
                    handleEdit(selectedProperty);
                  }}
                  className="flex items-center px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  <i className="fas fa-edit mr-2"></i>
                  แก้ไขข้อมูล
                </button>
                <button
                  onClick={() => {
                    closeDetailModal();
                    setConfirmDelete(selectedProperty);
                  }}
                  className="flex items-center px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:from-red-600 hover:to-pink-600 transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  <i className="fas fa-trash-alt mr-2"></i>
                  ลบอสังหาริมทรัพย์
                </button>
              </div>
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
                คุณแน่ใจหรือไม่ที่จะลบอสังหาริมทรัพย์{" "}
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
    </Layout>
  );
};

export default OwnerProperties;

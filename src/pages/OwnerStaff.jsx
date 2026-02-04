// src/pages/OwnerStaff.jsx
import React, { useEffect, useState, useCallback } from "react";
import API from "../api";
import Layout from "../components/Layout";

const OwnerStaff = () => {
  const [staffs, setStaffs] = useState([]);
  const [properties, setProperties] = useState([]); // เพิ่ม state สำหรับ properties
  const [form, setForm] = useState({
    username: "",
    fullname: "",
    email: "",
    phone: "",
    id_line: "",
    password: "",
    profile_image: "",
    property_ids: [], // เพิ่ม field สำหรับเก็บ property IDs
  });
  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [showGuest, setShowGuest] = useState(false);
  // State สำหรับการตรวจสอบ username และ email
  const [usernameValidation, setUsernameValidation] = useState({
    isValid: null,
    message: "",
    isChecking: false,
  });

  // เพิ่ม function สำหรับดึงข้อมูล properties
  const fetchProperties = useCallback(async () => {
    try {
      const res = await API.get("/properties/my");
      setProperties(res.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchStaff = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get(`/staff?showGuest=${showGuest}`);
      setStaffs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [showGuest]);

  useEffect(() => {
    fetchStaff();
    fetchProperties(); // เพิ่มการเรียก fetchProperties
  }, [fetchStaff, fetchProperties]);

  // ✅ ห่อ showToast ด้วย useCallback ให้ stable
  const showToast = useCallback((message, type = "success") => {
    setToast({ show: true, message, type });

    setTimeout(() => {
      setToast({ show: false, message: "", type: "" });
    }, 3000);
  }, []);

  // ✅ ห่อ checkUsername ด้วย useCallback
  const checkUsername = useCallback(
    async (username) => {
      if (!username) {
        setUsernameValidation({
          isValid: null,
          message: "",
          isChecking: false,
        });
        return;
      }

      const usernameRegex = /^[a-zA-Z0-9]{4,}$/;
      if (!usernameRegex.test(username)) {
        setUsernameValidation({
          isValid: false,
          message:
            "Username ต้องเป็นภาษาอังกฤษหรือตัวเลขเท่านั้น ไม่มีช่องว่าง และมีความยาวอย่างน้อย 4 ตัวอักษร",
          isChecking: false,
        });
        return;
      }

      setUsernameValidation({
        isValid: null,
        message: "กำลังตรวจสอบ...",
        isChecking: true,
      });

      try {
        const url = editingId
          ? `/staff/check-username/${username}?staffId=${editingId}`
          : `/staff/check-username/${username}`;

        const response = await API.get(url);
        setUsernameValidation({
          isValid: response.data.valid,
          message: response.data.message,
          isChecking: false,
        });
      } catch (err) {
        setUsernameValidation({
          isValid: false,
          message: "เกิดข้อผิดพลาดในการตรวจสอบ username",
          isChecking: false,
        });
        console.error(err);
      }
    },
    [editingId]
  );

  // ✅ useEffect สำหรับ username
  useEffect(() => {
    if (form.username) {
      const timer = setTimeout(() => {
        checkUsername(form.username);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [form.username, checkUsername]);

  // ใช้ useCallback กับ openModal
  const openModal = useCallback((staff = null) => {
    if (staff) {
      setEditingId(staff.id);
      setForm({
        username: staff.username || "",
        fullname: staff.fullname || "",
        email: staff.email || "",
        phone: staff.phone || "",
        id_line: staff.id_line || "",
        password: "",
        profile_image: staff.profile_image || "",
        property_ids: staff.properties
          ? staff.properties.map((p) => p.id) // ใช้ id ของหอที่ staff ดูแล
          : [],
        role: staff.role || "staff", // <-- เพิ่มตรงนี้
      });
    } else {
      setEditingId(null);
      setForm({
        username: "",
        fullname: "",
        email: "",
        phone: "",
        id_line: "",
        password: "",
        profile_image: "",
        property_ids: [],
      });
    }

    // รีเซ็ตการตรวจสอบ username และ email
    setUsernameValidation({ isValid: null, message: "", isChecking: false });

    setModalOpen(true);
  }, []);

  // ใช้ useCallback กับ closeModal
  const closeModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  // เพิ่ม function สำหรับจัดการการเลือก properties
  const handlePropertyChange = useCallback((propertyId) => {
    setForm((prev) => {
      const propertyIds = [...prev.property_ids];
      const index = propertyIds.indexOf(propertyId);

      if (index === -1) {
        propertyIds.push(propertyId);
      } else {
        propertyIds.splice(index, 1);
      }

      return { ...prev, property_ids: propertyIds };
    });
  }, []);

  // ใช้ useCallback กับ validateForm
  const validateForm = useCallback(() => {
    // ตรวจสอบ username
    if (!usernameValidation.isValid) {
      showToast("กรุณาตรวจสอบ Username ให้ถูกต้อง", "error");
      return false;
    }
    // ตรวจสอบรหัสผ่านสำหรับ staff ใหม่
    if (!editingId && (!form.password || form.password.length < 6)) {
      showToast("รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร", "error");
      return false;
    }
    // ตรวจสอบว่าได้เลือก property อย่างน้อย 1 ตัว
    if (form.property_ids.length === 0) {
      showToast("กรุณาเลือกหอพักอย่างน้อย 1 แห่ง", "error");
      return false;
    }
    return true;
  }, [
    usernameValidation.isValid,
    form.password,
    form.property_ids,
    editingId,
    showToast,
  ]);

  // ใช้ useCallback กับ handleSubmit
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!validateForm()) return;
      try {
        if (editingId) {
          await API.put(`/staff/${editingId}`, form);
          showToast("อัปเดตข้อมูลพนักงานสำเร็จ", "success");
          setEditingId(null);
        } else {
          await API.post("/staff", form);
          showToast("เพิ่มพนักงานสำเร็จ", "success");
        }
        setForm({
          username: "",
          fullname: "",
          email: "",
          phone: "",
          id_line: "",
          password: "",
          profile_image: "",
          property_ids: [],
        });
        closeModal();
        fetchStaff();
      } catch (err) {
        showToast(err.response?.data?.message || "เกิดข้อผิดพลาด", "error");
      }
    },
    [validateForm, editingId, form, closeModal, fetchStaff, showToast]
  );

  // ใช้ useCallback กับ handleDelete
  const handleDelete = useCallback(
    async (id) => {
      try {
        await API.delete(`/staff/${id}`);
        showToast("ลบพนักงานสำเร็จ", "success");
        setConfirmDelete(null);
        fetchStaff();
      } catch (err) {
        showToast(
          err.response?.data?.message || "เกิดข้อผิดพลาดในการลบข้อมูล",
          "error"
        );
      }
    },
    [fetchStaff, showToast]
  );

  const filteredStaffs = staffs.filter((staff) => {
    const matchesSearch =
      (staff.username || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (staff.fullname || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (staff.email || "").toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // ถ้า showGuest ติ๊ก → แสดงเฉพาะ guest
    if (showGuest) return staff.role === "guest";

    // ถ้าไม่ติ๊ก → แสดงเฉพาะ staff
    return staff.role !== "guest";
  });

  const uniqueStaffs = Array.from(
    new Map(filteredStaffs.map((s) => [s.id, s])).values()
  );

  return (
    <Layout role="owner" showFooter={false} showNav={false}>
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
      <div className="sticky top-0 z-10 bg-purple-400 text-white shadow-lg pb-4 pt-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-kanit mb-1">
                จัดการพนักงาน
              </h1>
              <p className="text-indigo-100 text-sm">
                เพิ่ม แก้ไข และลบข้อมูลพนักงาน
              </p>
            </div>
            <button
              onClick={() => openModal()}
              className="mt-3 sm:mt-0 bg-white text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center shadow-md hover:shadow-lg"
            >
              <i className="fas fa-user-plus mr-2"></i> เพิ่มพนักงานใหม่
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 max-w-md">
            {/* Search Bar */}
            <div className="flex-1 relative w-full">
              <input
                type="text"
                placeholder="ค้นหา ชื่อผู้ใช้ ชื่อ-นามสกุล เมล..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-800"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute left-3 top-2.5 text-gray-400">
                <i className="fas fa-search"></i>
              </div>
            </div>

            {/* Checkbox */}
            {/* <div className="flex items-center mt-2 sm:mt-0">
              <input
                type="checkbox"
                id="showGuest"
                checked={showGuest}
                onChange={(e) => setShowGuest(e.target.checked)}
                className="h-4 w-4 text-indigo-600 rounded"
              />
              <label htmlFor="showGuest" className="ml-2 text-sm text-gray-700">
                ผู้ใช้ทั่วไป
              </label>
            </div> */}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-h-[calc(95vh-120px)] overflow-y-auto bg-purple-50 p-4 md:p-6">
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
        ) : filteredStaffs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl shadow-lg">
            <div className="text-indigo-500 mb-4">
              <i className="fas fa-user-tie text-5xl"></i>
            </div>
            <h3 className="text-xl font-bold font-kanit mb-2">
              {searchTerm ? "ไม่พบพนักงานที่ค้นหา" : "ยังไม่มีพนักงาน"}
            </h3>
            <p className="text-gray-600 mb-6 max-w-md text-center">
              {searchTerm
                ? "ลองค้นหาด้วยคำอื่นหรือตรวจสอบการสะกด"
                : "เริ่มต้นโดยการเพิ่มพนักงานคนแรก"}
            </p>
            {!searchTerm && (
              <button
                onClick={() => openModal()}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-full font-medium hover:shadow-lg transition-all duration-300 flex items-center"
              >
                <i className="fas fa-user-plus mr-2"></i> เพิ่มพนักงานใหม่
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {uniqueStaffs.map((s) => (
              <div
                key={s.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1"
              >
                {/* Staff Header */}
                <div className="p-5 bg-gradient-to-r from-indigo-50 to-purple-50">
                  <div className="flex items-center">
                    {s.profile_image ? (
                      <img
                        src={s.profile_image}
                        alt={s.fullname}
                        className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center shadow-md">
                        <i className="fas fa-user-tie text-2xl text-indigo-500"></i>
                      </div>
                    )}
                    <div className="ml-4">
                      <h3 className="text-xl font-bold font-kanit text-gray-800">
                        {s.fullname}
                      </h3>
                      <p className="text-gray-600 text-sm">@{s.username}</p>
                    </div>
                  </div>
                </div>

                {/* Staff Details */}
                <div className="p-5">
                  <div className="space-y-3 mb-4">
                    <div className="flex items-start">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3 flex-shrink-0">
                        <i className="fas fa-envelope text-blue-500 text-sm"></i>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">อีเมล</p>
                        <p className="text-sm text-gray-700">{s.email}</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3 flex-shrink-0">
                        <i className="fas fa-phone text-green-500 text-sm"></i>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">เบอร์โทรศัพท์</p>
                        <p className="text-sm text-gray-700">
                          {s.phone || "ไม่ระบุ"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mr-3 flex-shrink-0">
                        <i className="fab fa-line text-purple-500 text-sm"></i>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">ID Line</p>
                        <p className="text-sm text-gray-700">
                          {s.id_line || "ไม่ระบุ"}
                        </p>
                      </div>
                    </div>

                    {/* เพิ่มส่วนแสดง properties ที่พนักงานดูแล */}
                    {s.role !== "guest" && (
                      <div className="flex items-start">
                        <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center mr-3 flex-shrink-0">
                          <i className="fas fa-building text-yellow-500 text-sm"></i>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">
                            หอพักที่รับผิดชอบ
                          </p>
                          <p className="text-sm text-gray-700">
                            {s.property_names && s.property_names.length > 0
                              ? s.property_names.join(", ")
                              : "ไม่ระบุ"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                    <div className="text-xs text-gray-500">ID: {s.id}</div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openModal(s)}
                        className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 hover:bg-yellow-200 transition-colors duration-200"
                        title="แก้ไข"
                      >
                        <i className="fas fa-edit text-sm"></i>
                      </button>
                      {/* ปุ่มลบเฉพาะ staff ไม่ใช่ guest */}
                      {s.role !== "guest" && (
                        <button
                          onClick={() => setConfirmDelete(s)}
                          className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 hover:bg-red-200 transition-colors duration-200"
                          title="ลบ"
                        >
                          <i className="fas fa-trash-alt text-sm"></i>
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

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md transform transition-all duration-300 scale-95 animate-scaleIn">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold font-kanit">
                  {editingId ? "แก้ไขข้อมูลพนักงาน" : "เพิ่มพนักงานใหม่"}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ชื่อผู้ใช้
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="ชื่อผู้ใช้"
                      className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                        usernameValidation.isValid === false
                          ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                          : usernameValidation.isValid === true
                          ? "border-green-500 focus:ring-green-500 focus:border-green-500"
                          : "border-gray-300"
                      }`}
                      value={form.username}
                      onChange={(e) => {
                        if (editingId && form.role === "guest") return; // ถ้า guest ห้ามแก้
                        const value = e.target.value.replace(
                          /[^a-zA-Z0-9]/g,
                          ""
                        );
                        setForm({ ...form, username: value });
                      }}
                      required
                      disabled={editingId && form.role === "guest"} // disable สำหรับ guest
                    />
                    {usernameValidation.isChecking && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500"></div>
                      </div>
                    )}
                  </div>
                  {usernameValidation.message && (
                    <div
                      className={`mt-1 text-sm ${
                        usernameValidation.isValid === false
                          ? "text-red-600"
                          : usernameValidation.isValid === true
                          ? "text-green-600"
                          : "text-gray-500"
                      }`}
                    >
                      {usernameValidation.message}
                    </div>
                  )}
                </div>

                {/* Multi-select dropdown for properties */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    หอพักที่รับผิดชอบ <span className="text-red-500">*</span>
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
                            type="checkbox"
                            id={`property-${property.id}`}
                            checked={form.property_ids.includes(property.id)}
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
                  {form.property_ids.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {form.property_ids.map((id, idx) => {
                        const property = properties.find((p) => p.id === id);
                        return property ? (
                          <span
                            key={`${id}-${idx}`}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                          >
                            {property.name}
                            <button
                              type="button"
                              className="ml-1 text-indigo-600 hover:text-indigo-900"
                              onClick={() => handlePropertyChange(id)}
                            >
                              <i className="fas fa-times text-xs"></i>
                            </button>
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    รหัสผ่าน{" "}
                    {editingId && (
                      <span className="text-gray-500 text-xs">
                        (เว้นว่างถ้าไม่เปลี่ยน)
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      value={form.password}
                      onChange={(e) =>
                        setForm({ ...form, password: e.target.value })
                      }
                      {...(!editingId && { required: true })}
                      disabled={editingId && form.role === "guest"} // disable สำหรับ guest
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <i
                        className={`fas ${
                          showPassword ? "fa-eye-slash" : "fa-eye"
                        } text-gray-400`}
                      ></i>
                    </button>
                  </div>
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
                    disabled={
                      !usernameValidation.isValid ||
                      form.property_ids.length === 0
                    }
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                      usernameValidation.isValid && form.property_ids.length > 0
                        ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:shadow-md"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    {editingId ? "อัปเดตข้อมูล" : "เพิ่มพนักงาน"}
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
                คุณแน่ใจหรือไม่ที่จะลบพนักงาน{" "}
                <span className="font-bold text-gray-800">
                  {confirmDelete.username}
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

export default OwnerStaff;

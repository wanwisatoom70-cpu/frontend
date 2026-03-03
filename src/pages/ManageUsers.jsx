// src/pages/ManageUsers.jsx
import React, { useEffect, useState, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import Layout from "../components/Layout";
import API from "../api";
const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const location = useLocation();
  const [properties, setProperties] = useState([]);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [currentUser, setCurrentUser] = useState(null);
  // ดึงข้อมูลผู้ใช้ปัจจุบันตอนโหลดหน้า
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await API.get("/users/me");
        setCurrentUser(res.data);
      } catch (err) {
        console.error("ไม่สามารถดึงข้อมูลผู้ใช้ปัจจุบันได้", err);
      }
    };
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("add") === "true") {
      setEditData({});
      setModalOpen(true);
    }
  }, [location]);
  const [usernameValidation, setUsernameValidation] = useState({
    isValid: null,
    message: "",
    isChecking: false,
  });
  // ลบตัวแปร username ที่ไม่ได้ใช้
  const editDataRef = useRef(editData);
  // อัปเดตค่า editDataRef เมื่อ editData เปลี่ยน
  useEffect(() => {
    editDataRef.current = editData;
  }, [editData]);
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await API.get("/users");
      // สร้าง current_booking
      const usersWithCurrentBooking = res.data.map((user) => {
        if (
          user.role === "tenant" &&
          user.bookings &&
          user.bookings.length > 0
        ) {
          // ดึง rooms ทั้งหมดจากทุก property
          const allBookings = user.bookings.flatMap((p) => p.rooms);
          const sorted = [...allBookings].sort(
            (a, b) => new Date(b.start_date) - new Date(a.start_date),
          );
          const currentBooking =
            sorted.find(
              (bk) => bk.status === "confirmed" || bk.status === "pending",
            ) || sorted[0];
          return { ...user, current_booking: currentBooking };
        }
        return user;
      });
      setUsers(usersWithCurrentBooking);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  const fetchProperties = async () => {
    try {
      const res = await API.get("/properties");
      setProperties(res.data);
    } catch (err) {
      console.error(err);
    }
  };
  useEffect(() => {
    fetchUsers();
    fetchProperties();
  }, []);
  const checkUsername = useCallback(
    async (username) => {
      // ถ้า username ว่าง ให้รีเซ็ตการตรวจสอบ
      if (!username) {
        setUsernameValidation({
          isValid: null,
          message: "",
          isChecking: false,
        });
        return;
      }
      // ตรวจสอบรูปแบบพื้นฐานก่อนส่งไปยัง API
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
      // แสดงสถานะกำลังตรวจสอบ
      setUsernameValidation({
        isValid: null,
        message: "กำลังตรวจสอบ...",
        isChecking: true,
      });
      try {
        // ใช้ค่าจาก editDataRef แทน editData
        const currentEditData = editDataRef.current;
        const url = currentEditData?.id
          ? `/users/check-username/${username}?userId=${currentEditData.id}`
          : `/users/check-username/${username}`;
        const response = await API.get(url);

        // ถ้า username ซ้ำ (API บอกว่า valid = false)
        if (!response.data.valid) {
          setUsernameValidation({
            isValid: false,
            message: response.data.message,
            isChecking: false,
          });
        } else if (
          currentEditData?.id &&
          currentEditData.username === username
        ) {
          // username เดิมของตัวเอง
          setUsernameValidation({
            isValid: true,
            message: "Username เดิม (ไม่มีการเปลี่ยนแปลง)",
            isChecking: false,
          });
        } else {
          // username ใหม่ ใช้ได้
          setUsernameValidation({
            isValid: true,
            message: response.data.message,
            isChecking: false,
          });
        }
      } catch (err) {
        setUsernameValidation({
          isValid: false,
          message: "เกิดข้อผิดพลาดในการตรวจสอบ username",
          isChecking: false,
        });
        console.error(err);
      }
    },
    [], // ไม่ต้องมี dependencies เพราะใช้ editDataRef
  );
  const validateForm = () => {
    // ตรวจสอบ username
    if (!usernameValidation.isValid) {
      showToast("กรุณาตรวจสอบ Username ให้ถูกต้อง", "error");
      return false;
    }
    // ตรวจสอบ fullname
    if (!editData.fullname || editData.fullname.trim() === "") {
      showToast("กรุณากรอกชื่อ-นามสกุล", "error");
      return false;
    }
    // ตรวจสอบ email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!editData.email || !emailRegex.test(editData.email)) {
      showToast("กรุณากรอกอีเมลให้ถูกต้อง", "error");
      return false;
    }
    // ตรวจสอบรหัสผ่านสำหรับผู้ใช้ใหม่
    if (!editData.id && (!editData.password || editData.password.length < 6)) {
      showToast("รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร", "error");
      return false;
    }
    // ตรวจสอบบทบาท
    if (!editData.role) {
      showToast("กรุณาเลือกบทบาท", "error");
      return false;
    }
    return true;
  };
  // ตรวจสอบ username เมื่อมีการเปลี่ยนแปลง
  useEffect(() => {
    if (!editData?.username) {
      // รีเซ็ต validation เมื่อ username ว่าง
      setUsernameValidation({
        isValid: null,
        message: "",
        isChecking: false,
      });
      return;
    }
    const timer = setTimeout(() => {
      checkUsername(editData?.username); // เรียกตรวจสอบ
    }, 100); // debounce 100ms
    return () => clearTimeout(timer);
  }, [editData?.username, checkUsername]); // เฉพาะ username และ checkUsername เท่านั้น
  // ตรวจสอบ username เมื่อ modal เปิด
  useEffect(() => {
    if (modalOpen && editData?.username) {
      checkUsername(editData?.username);
    }
  }, [modalOpen, editData?.username, checkUsername]);

  // ฟังก์ชันตรวจสอบความถูกต้องของฟอร์มก่อนบันทึก
  const isFormValid = () => {
    if (!editData) return false;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const isUsernameValid = usernameValidation.isValid === true;
    const isFullnameValid =
      editData.fullname && editData.fullname.trim() !== "";
    const isEmailValid = editData.email && emailRegex.test(editData.email);
    const isRoleValid = !!editData.role;

    // 🔹 กรณีเพิ่มผู้ใช้ใหม่ → ต้องมีรหัสผ่านและ >= 6
    if (!editData.id) {
      const isPasswordValid =
        editData.password && editData.password.length >= 6;

      return (
        isUsernameValid &&
        isFullnameValid &&
        isEmailValid &&
        isRoleValid &&
        isPasswordValid
      );
    }

    // 🔹 กรณีแก้ไข → ถ้ามีการกรอกรหัสผ่าน ต้อง >= 6
    if (editData.password && editData.password.length > 0) {
      if (editData.password.length < 6) return false;
    }

    return isUsernameValid && isFullnameValid && isEmailValid && isRoleValid;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    try {
      // เตรียม payload
      let payload = { ...editData };

      if (editData.id) {
        // แก้ไขผู้ใช้
        const originalUser = users.find((u) => u.id === editData.id);

        // สำหรับ owner/staff ตรวจสอบ property_ids
        if (
          (editData.role === "owner" || editData.role === "staff") &&
          originalUser.properties
        ) {
          const originalPropertyIds = originalUser.properties
            .map((p) => p.id)
            .sort();
          const newPropertyIds = (editData.property_ids || []).sort();

          // ถ้าเหมือนกัน → ลบ property_ids ออกจาก payload
          if (
            originalPropertyIds.length === newPropertyIds.length &&
            originalPropertyIds.every((id, idx) => id === newPropertyIds[idx])
          ) {
            delete payload.property_ids;
          }
        }

        // สำหรับ tenant/guest อาจมีการ mapping ห้องเช่า
        if (
          (editData.role === "tenant" || editData.role === "guest") &&
          originalUser.room_ids
        ) {
          const originalRoomIds = originalUser.room_ids.sort();
          const newRoomIds = (editData.room_ids || []).sort();
          if (
            originalRoomIds.length === newRoomIds.length &&
            originalRoomIds.every((id, idx) => id === newRoomIds[idx])
          ) {
            delete payload.room_ids;
          }
        }

        await API.put(`/users/${editData.id}`, payload);
        showToast("อัปเดตข้อมูลผู้ใช้สำเร็จ", "success");
      } else {
        // เพิ่มผู้ใช้ใหม่
        await API.post("/users", payload);
        showToast("เพิ่มผู้ใช้สำเร็จ", "success");
      }

      setModalOpen(false);
      fetchUsers();
    } catch (err) {
      showToast(
        err.response?.data?.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
        "error",
      );
    }
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/users/${id}`);
      showToast("ลบผู้ใช้สำเร็จ", "success");
      setConfirmDelete(null);
      fetchUsers();
    } catch (err) {
      showToast(err.response?.data?.message || "ไม่สามารถลบผู้ใช้ได้", "error");
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    // ซ่อน toast หลังจาก 3 วินาที
    setTimeout(() => {
      setToast({ show: false, message: "", type: "" });
    }, 3000);
  };
  // รีเซ็ตการตรวจสอบเมื่อเปิด modal ใหม่
  useEffect(() => {
    if (modalOpen) {
      setUsernameValidation({
        isValid: null,
        message: "",
        isChecking: false,
      });
    }
  }, [modalOpen]);
  const closeModal = () => {
    setModalOpen(false);
    setUsernameValidation({
      isValid: null,
      message: "",
      isChecking: false,
    });
  };
  const filteredUsers = users.filter((u) => {
    const propertyNames = u.properties?.map((p) => p.name).join(", ") || "";
    const searchLower = search.toLowerCase();

    return (
      (u.username || "").toLowerCase().includes(searchLower) ||
      (u.fullname || "").toLowerCase().includes(searchLower) ||
      (u.email || "").toLowerCase().includes(searchLower) ||
      propertyNames.toLowerCase().includes(searchLower) ||
      (u.role || "").toLowerCase().includes(searchLower)
    );
  });

  const getRoleBadge = (role) => {
    switch (role) {
      case "admin":
        return {
          text: "ผู้ดูแลระบบ",
          bgColor: "bg-purple-100",
          textColor: "text-purple-800",
          icon: "fas fa-user-shield",
        };
      case "owner":
        return {
          text: "เจ้าของ",
          bgColor: "bg-blue-100",
          textColor: "text-blue-800",
          icon: "fas fa-building",
        };
      case "staff":
        return {
          text: "พนักงาน",
          bgColor: "bg-green-100",
          textColor: "text-green-800",
          icon: "fas fa-user-tie",
        };
      case "tenant":
        return {
          text: "ผู้เช่า",
          bgColor: "bg-yellow-100",
          textColor: "text-yellow-800",
          icon: "fas fa-user",
        };
      case "guest":
        return {
          text: "ผู้ใช้",
          bgColor: "bg-gray-100",
          textColor: "text-gray-800",
          icon: "fas fa-user",
        };
      default:
        return {
          text: role,
          bgColor: "bg-gray-100",
          textColor: "text-gray-800",
          icon: "fas fa-question-circle",
        };
    }
  };
  // Component สำหรับเลือกอสังหาริมทรัพย์แบบ Multi-Select
  const PropertyMultiSelect = ({
    properties,
    selectedProperties,
    onChange,
  }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [dropdownDirection, setDropdownDirection] = useState("down"); // "down" or "up"
    const containerRef = useRef(null);
    const menuRef = useRef(null);
    const filteredProperties = properties.filter((property) =>
      property.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    const toggleProperty = (propertyId) => {
      const newSelected = selectedProperties.includes(propertyId)
        ? selectedProperties.filter((id) => id !== propertyId)
        : [...selectedProperties, propertyId];
      onChange(newSelected);
    };
    const getPropertyName = (propertyId) => {
      const property = properties.find((p) => p.id === propertyId);
      return property ? property.name : "ไม่ทราบ";
    };
    // ตรวจสอบตำแหน่ง dropdown เมื่อเปิด
    useEffect(() => {
      if (isOpen && containerRef.current && menuRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const menuHeight = 300; // ความสูงโดยประมาณของ dropdown
        const spaceBelow = window.innerHeight - containerRect.bottom;
        const spaceAbove = containerRect.top;
        // ถ้ามีพื้นที่ด้านล่างไม่เพียงพอ แต่ด้านบนมีพื้นที่เพียงพอ
        if (spaceBelow < menuHeight && spaceAbove > menuHeight) {
          setDropdownDirection("up");
        } else {
          setDropdownDirection("down");
        }
      }
    }, [isOpen]);
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (event.target.closest(".property-multiselect") === null) {
          setIsOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);
    return (
      <div className="relative property-multiselect" ref={containerRef}>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          อสังหาริมทรัพย์
        </label>
        <div
          className="min-h-[42px] border border-gray-300 rounded-lg p-2 cursor-pointer bg-white"
          onClick={() => setIsOpen(!isOpen)}
        >
          {selectedProperties.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {selectedProperties.map((id) => (
                <span
                  key={id}
                  className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded"
                >
                  {getPropertyName(id)}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-gray-500">เลือกอสังหาริมทรัพย์...</span>
          )}
        </div>
        {isOpen && (
          <div
            ref={menuRef}
            className={`absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg ${
              dropdownDirection === "up" ? "bottom-full mb-1" : "top-full mt-1"
            }`}
            style={{ maxHeight: "300px" }}
          >
            <div className="p-2 border-b">
              <input
                type="text"
                placeholder="ค้นหาอสังหาริมทรัพย์..."
                className="w-full p-2 border border-gray-300 rounded"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className="max-h-60 overflow-y-auto">
              {filteredProperties.length > 0 ? (
                filteredProperties.map((property) => (
                  <div
                    key={property.id}
                    className="flex items-center p-2 hover:bg-gray-100 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleProperty(property.id);
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedProperties.includes(property.id)}
                      onChange={() => toggleProperty(property.id)}
                      className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span>{property.name}</span>
                  </div>
                ))
              ) : (
                <div className="p-2 text-gray-500">ไม่พบอสังหาริมทรัพย์</div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };
  // แปลงข้อมูล properties ของผู้ใช้เป็น array ของ ID
  useEffect(() => {
    if (modalOpen && editData) {
      // ตรวจสอบว่ามีข้อมูล properties หรือไม่
      if (
        !editData.property_ids &&
        editData.properties &&
        Array.isArray(editData.properties)
      ) {
        // แปลงจาก properties array จาก API เป็น property_ids
        setEditData({
          ...editData,
          property_ids: editData.properties.map((property) => property.id),
        });
      } else if (!editData.property_ids && editData.property_id) {
        // แปลงจาก property_id เดี่ยวเป็น property_ids array
        setEditData({
          ...editData,
          property_ids: editData.property_id ? [editData.property_id] : [],
        });
      }
      // ตรวจสอบว่ามีข้อมูล rooms สำหรับ tenant หรือไม่
      if (
        editData.role === "tenant" &&
        !editData.room_ids &&
        editData.properties &&
        Array.isArray(editData.properties)
      ) {
        // แปลงข้อมูล rooms จาก properties เป็น room_ids array
        const roomIds = [];
        editData.properties.forEach((property) => {
          if (property.rooms && Array.isArray(property.rooms)) {
            property.rooms.forEach((room) => {
              roomIds.push(`${property.id}-${room.id}`);
            });
          }
        });
        setEditData({
          ...editData,
          room_ids: roomIds,
        });
      }
    }
  }, [modalOpen, editData]);

  useEffect(() => {
    return () => {
      users.forEach((u) => {
        if (u.profile_image instanceof File) {
          URL.revokeObjectURL(u.profile_image);
        }
      });
    };
  }, [users]);

  return (
    <Layout role="admin" showFooter={false} showNav={false}>
      {/* Toast Notification */}
      {toast.show && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-white transform transition-all duration-300 ${
            toast.type === "success" ? "bg-green-500" : "bg-red-500"
          }`}
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-kanit mb-1">
                จัดการผู้ใช้
              </h1>
              <p className="text-indigo-100 text-sm">
                จัดการข้อมูลผู้ใช้ทั้งหมดในระบบ
              </p>
            </div>
            <div className="flex gap-2 mt-3 sm:mt-0">
              <div className="relative">
                <input
                  type="text"
                  placeholder="ค้นหาผู้ใช้..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 rounded-lg border-0 text-gray-800 focus:ring-2 focus:ring-white focus:ring-opacity-50"
                />
                <div className="absolute left-3 top-2.5 text-white text-opacity-70">
                  <i className="fas fa-search"></i>
                </div>
              </div>
              <button
                onClick={() => {
                  setEditData({});
                  setModalOpen(true);
                }}
                className="bg-white text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center shadow-md hover:shadow-lg"
              >
                <i className="fas fa-user-plus mr-2"></i> เพิ่มผู้ใช้
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Main Content */}
      <div className="max-h-[calc(102vh-120px)] overflow-y-auto bg-purple-50 p-4 md:p-6">
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
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl shadow-lg">
            <div className="text-indigo-500 mb-4">
              <i className="fas fa-users text-5xl"></i>
            </div>
            <h3 className="text-xl font-bold font-kanit mb-2">
              {search ? "ไม่พบผู้ใช้ที่ค้นหา" : "ยังไม่มีผู้ใช้"}
            </h3>
            <p className="text-gray-600 mb-6 max-w-md text-center">
              {search
                ? "ลองค้นหาด้วยคำอื่นหรือตรวจสอบการสะกด"
                : "เริ่มต้นโดยการเพิ่มผู้ใช้คนแรก"}
            </p>
            {!search && (
              <button
                onClick={() => {
                  setEditData({});
                  setModalOpen(true);
                }}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-full font-medium hover:shadow-lg transition-all duration-300 flex items-center"
              >
                <i className="fas fa-user-plus mr-2"></i> เพิ่มผู้ใช้ใหม่
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((u) => {
              const roleBadge = getRoleBadge(u.role);
              return (
                <div
                  key={u.id}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1"
                >
                  {/* User Header */}
                  <div className="p-5 bg-gradient-to-r from-indigo-50 to-purple-50">
                    <div className="flex items-center">
                      {u.profile_image &&
                      u.profile_image.startsWith("/uploads") ? (
                        <img
                          src={`${import.meta.env.VITE_API_URL}${u.profile_image}`}
                          alt={u.fullname}
                          className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "/default-avatar.png";
                          }}
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center shadow-md">
                          <i className="fas fa-user text-2xl text-indigo-500"></i>
                        </div>
                      )}

                      <div className="ml-4">
                        <h3 className="text-xl font-bold font-kanit text-gray-800">
                          {u.fullname}
                        </h3>
                        <p className="text-gray-600 text-sm">@{u.username}</p>
                      </div>
                    </div>
                  </div>
                  {/* User Details */}
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div
                        className={`${roleBadge.bgColor} ${roleBadge.textColor} px-3 py-1 rounded-full text-xs font-medium flex items-center`}
                      >
                        <i className={`${roleBadge.icon} mr-1`}></i>
                        {roleBadge.text}
                      </div>
                      <div className="flex space-x-2">
                        {u.id === currentUser.id ? (
                          <span className="text-gray-500 italic">คุณ</span>
                        ) : (
                          <>
                            {u.role !== "tenant" && (
                              <>
                                <button
                                  onClick={() => {
                                    setEditData(u);
                                    setModalOpen(true);
                                  }}
                                  className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 hover:bg-yellow-200 transition-colors duration-200"
                                  title="แก้ไข"
                                >
                                  <i className="fas fa-edit text-sm"></i>
                                </button>
                                <button
                                  onClick={() => setConfirmDelete(u)}
                                  className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 hover:bg-red-200 transition-colors duration-200"
                                  title="ลบ"
                                >
                                  <i className="fas fa-trash-alt text-sm"></i>
                                </button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    <div className="space-y-3 mb-4">
                      <div className="flex items-start">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3 flex-shrink-0">
                          <i className="fas fa-envelope text-blue-500 text-sm"></i>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">อีเมล</p>
                          <p className="text-sm text-gray-700">{u.email}</p>
                        </div>
                      </div>
                      {(u.role === "owner" || u.role === "staff") &&
                        u.properties &&
                        u.properties.length > 0 && (
                          <div className="flex items-start">
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3 flex-shrink-0">
                              <i className="fas fa-building text-green-500 text-sm"></i>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">
                                อสังหาริมทรัพย์
                              </p>
                              <p className="text-sm text-gray-700">
                                {u.properties.map((p) => p.name).join(", ")}
                              </p>
                            </div>
                          </div>
                        )}
                      {/* แสดงข้อมูลการเช่าสำหรับ tenant */}
                      {u.role === "tenant" &&
                        u.properties &&
                        u.properties.length > 0 && (
                          <div className="flex items-start">
                            <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center mr-3 flex-shrink-0">
                              <i className="fas fa-door-open text-yellow-500 text-sm"></i>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">การเช่า</p>
                              {u.properties.map((prop) => (
                                <div key={prop.id} className="mb-1">
                                  <p className="text-sm font-semibold text-gray-800">
                                    {prop.name}
                                  </p>
                                  {prop.rooms && prop.rooms.length > 0 && (
                                    <ul className="ml-4 list-disc text-gray-700 text-sm">
                                      {prop.rooms.map((room) => (
                                        <li key={room.id}>
                                          ห้อง {room.name} ({room.code})
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl transform transition-all duration-300 scale-95 animate-scaleIn">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold font-kanit">
                  {editData?.id ? "แก้ไขข้อมูลผู้ใช้" : "เพิ่มผู้ใช้ใหม่"}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* คอลัมน์ซ้าย - ข้อมูลผู้ใช้ */}
                <div className="space-y-4">
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
                        value={editData?.username || ""}
                        onChange={(e) => {
                          // อนุญาตเฉพาะภาษาอังกฤษและตัวเลขเท่านั้น
                          const value = e.target.value.replace(
                            /[^a-zA-Z0-9]/g,
                            "",
                          );
                          setEditData({ ...editData, username: value });
                        }}
                        required
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ชื่อ-นามสกุล
                    </label>
                    <input
                      type="text"
                      placeholder="ชื่อ-นามสกุล"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      value={editData?.fullname || ""}
                      onChange={(e) =>
                        setEditData({ ...editData, fullname: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      อีเมล
                    </label>
                    <input
                      type="email"
                      placeholder="อีเมล"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      value={editData?.email || ""}
                      onChange={(e) =>
                        setEditData({ ...editData, email: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      รหัสผ่าน{" "}
                      {editData?.id && (
                        <span className="text-gray-500 text-xs">
                          (เว้นว่างถ้าไม่เปลี่ยน)
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        minLength={6}
                        placeholder="รหัสผ่านอย่างน้อย 6 ตัว"
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        value={editData?.password || ""}
                        onChange={(e) =>
                          setEditData({ ...editData, password: e.target.value })
                        }
                        {...(!editData?.id && { required: true })}
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
                </div>
                {/* คอลัมน์ขวา - บทบาทและข้อมูลเพิ่มเติม */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      บทบาท
                    </label>
                    <select
                      value={editData?.role || ""}
                      onChange={(e) =>
                        setEditData({ ...editData, role: e.target.value })
                      }
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    >
                      <option value="">-- เลือกบทบาท --</option>
                      <option value="admin">ผู้ดูแลระบบ</option>
                      <option value="owner">เจ้าของ</option>
                      <option value="staff">พนักงาน</option>
                    </select>
                  </div>
                  {/* แสดงเฉพาะเมื่อ role เป็น owner หรือ staff */}
                  {(editData?.role === "owner" ||
                    editData?.role === "staff") && (
                    <PropertyMultiSelect
                      properties={properties}
                      selectedProperties={editData?.property_ids || []}
                      onChange={(property_ids) =>
                        setEditData({ ...editData, property_ids })
                      }
                    />
                  )}
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-6 mt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!isFormValid()}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                    isFormValid()
                      ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:shadow-md"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {editData?.id ? "อัปเดต" : "บันทึก"}
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
                คุณแน่ใจหรือไม่ที่จะลบผู้ใช้{" "}
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
export default ManageUsers;

// pages/ManageRooms.jsx
import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import API from "../api";

const ManageRooms = () => {
  const [properties, setProperties] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [search, setSearch] = useState("");
  const [propertySearch, setPropertySearch] = useState(""); // เพิ่ม state สำหรับค้นหาอสังหาริมทรัพย์
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingProperties, setLoadingProperties] = useState(true);

  const fetchProperties = async () => {
    try {
      setLoadingProperties(true);
      const res = await API.get("/properties");
      setProperties(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProperties(false);
    }
  };

  const fetchRooms = async (propertyId) => {
    try {
      setLoading(true);
      const res = await API.get(`/properties/${propertyId}/rooms`);
      setRooms(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const handleViewRooms = (property) => {
    setSelectedProperty(property);
    fetchRooms(property.id);
  };

  const handleSave = async () => {
    try {
      if (editData.id) {
        await API.put(`/rooms/${editData.id}`, editData);
      } else {
        await API.post(`/rooms`, {
          ...editData,
          property_id: selectedProperty.id,
        });
      }
      setModalOpen(false);
      setEditData(null);
      fetchRooms(selectedProperty.id);
    } catch (err) {
      alert(err.response?.data?.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    }
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/rooms/${id}`);
      setConfirmDelete(null);
      fetchRooms(selectedProperty.id);
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการลบข้อมูล");
    }
  };

  // แก้ไขฟังก์ชัน filteredProperties โดยเพิ่มการตรวจสอบค่า null
  const filteredProperties = properties.filter(
    (p) =>
      (p.name || "").toLowerCase().includes(propertySearch.toLowerCase()) ||
      (p.address || "").toLowerCase().includes(propertySearch.toLowerCase())
  );

  // แก้ไขฟังก์ชัน filteredRooms โดยเพิ่มการตรวจสอบค่า null
  const filteredRooms = rooms.filter(
    (r) =>
      (r.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.code || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.price_monthly || "").toString().includes(search) ||
      (r.price_term || "").toString().includes(search) ||
      (r.billing_cycle || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.status || "").toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status) => {
    switch (status) {
      case "occupied":
        return {
          text: "เต็ม",
          bgColor: "bg-red-100",
          textColor: "text-red-800",
        };
      case "available":
        return {
          text: "ว่าง",
          bgColor: "bg-green-100",
          textColor: "text-green-800",
        };
      case "pending":
        return {
          text: "กำลังดำเนินการ",
          bgColor: "bg-yellow-100",
          textColor: "text-yellow-800",
        };
      case "maintenance":
        return {
          text: "ซ่อมบำรุง",
          bgColor: "bg-orange-100",
          textColor: "text-orange-800",
        };
      default:
        return {
          text: status,
          bgColor: "bg-gray-100",
          textColor: "text-gray-800",
        };
    }
  };

  if (!selectedProperty) {
    return (
      <Layout role="admin" showFooter={false} showNav={false}>
        {/* Sticky Header with Gradient Background */}
        <div className="sticky top-0 z-10 bg-orange-400 text-white shadow-lg pb-4 pt-2">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold font-kanit mb-1">
                  จัดการห้องพัก
                </h1>
                <p className="text-indigo-100 text-sm">
                  เลือกอสังหาริมทรัพย์เพื่อดูและจัดการห้องพัก
                </p>
              </div>
            </div>

            {/* เพิ่ม Search Bar สำหรับค้นหาอสังหาริมทรัพย์ */}
            <div className="relative max-w-md">
              <input
                type="text"
                placeholder="ค้นหาอสังหาริมทรัพย์ (ชื่อ, ที่อยู่)..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border-0 text-gray-800 focus:ring-2 focus:ring-white focus:ring-opacity-50"
                value={propertySearch}
                onChange={(e) => setPropertySearch(e.target.value)}
              />
              <div className="absolute left-3 top-2.5 text-white text-opacity-70">
                <i className="fas fa-search"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-h-[calc(95vh-120px)] overflow-y-auto bg-orange-50 p-4 md:p-6">
          {/* Loading State */}
          {loadingProperties ? (
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
                    <div className="h-10 w-24 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : properties.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl shadow-lg">
              <div className="text-indigo-500 mb-4">
                <i className="fas fa-building text-5xl"></i>
              </div>
              <h3 className="text-xl font-bold font-kanit mb-2">
                ยังไม่มีอสังหาริมทรัพย์
              </h3>
              <p className="text-gray-600 mb-6 max-w-md text-center">
                คุณต้องสร้างอสังหาริมทรัพย์ก่อนจึงจะจัดการห้องพักได้
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProperties.map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1"
                >
                  {/* Property Image */}
                  <div className="h-48 overflow-hidden">
                    <img
                      src={(() => {
                        if (!p.image) return "/default-dorm.jpg";

                        // กรณีเป็น string
                        if (typeof p.image === "string") {
                          if (
                            p.image.startsWith("http") ||
                            p.image.startsWith("https")
                          ) {
                            return p.image; // URL ภายนอก
                          }
                          if (p.image.startsWith("/uploads")) {
                            return `http://localhost:5000${p.image}`; // Path จาก backend
                          }
                          return p.image; // fallback สำหรับ string อื่น ๆ
                        }

                        // กรณีเป็น File object
                        if (p.image instanceof File) {
                          return URL.createObjectURL(p.image);
                        }

                        return "/default-dorm.jpg"; // default fallback
                      })()}
                      alt={p.name}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/default-dorm.jpg";
                      }}
                    />
                  </div>

                  {/* Property Details */}
                  <div className="p-5">
                    <h3 className="text-xl font-bold font-kanit text-gray-800 mb-2">
                      {p.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 flex items-start">
                      <i className="fas fa-map-marker-alt mr-2 text-indigo-500 mt-1"></i>
                      {p.address}
                    </p>

                    <div className="flex justify-between items-center">
                      <div className="text-xs text-gray-500">ID: {p.id}</div>
                      <button
                        onClick={() => handleViewRooms(p)}
                        className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:shadow-md transition-all duration-300 flex items-center"
                      >
                        <i className="fas fa-door-open mr-2"></i> ดูห้องพัก
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Layout>
    );
  }

  return (
    <Layout role="admin" showFooter={false} showNav={false}>
      {/* Sticky Header with Gradient Background */}
      <div className="sticky top-0 z-10 bg-orange-400 text-white shadow-lg pb-4 pt-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-kanit mb-1">
                ห้องพักใน {selectedProperty.name}
              </h1>
              <p className="text-indigo-100 text-sm">
                จัดการห้องพักทั้งหมดในอสังหาริมทรัพย์นี้
              </p>
            </div>
            <div className="flex gap-2 mt-3 sm:mt-0">
              <div className="relative">
                <input
                  type="text"
                  placeholder="ค้นหาห้องพัก..."
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
                <i className="fas fa-plus mr-2"></i> เพิ่มห้อง
              </button>
              <button
                onClick={() => setSelectedProperty(null)}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center"
              >
                <i className="fas fa-arrow-left mr-2"></i> ย้อนกลับ
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-h-[calc(102vh-120px)] overflow-y-auto bg-orange-50 p-4 md:p-6">
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
        ) : filteredRooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl shadow-lg">
            <div className="text-indigo-500 mb-4">
              <i className="fas fa-door-closed text-5xl"></i>
            </div>
            <h3 className="text-xl font-bold font-kanit mb-2">
              {search ? "ไม่พบห้องพักที่ค้นหา" : "ยังไม่มีห้องพัก"}
            </h3>
            <p className="text-gray-600 mb-6 max-w-md text-center">
              {search
                ? "ลองค้นหาด้วยเงื่อนไขอื่น"
                : "เริ่มต้นโดยการเพิ่มห้องพักแรกของคุณ"}
            </p>
            {!search && (
              <button
                onClick={() => {
                  setEditData({});
                  setModalOpen(true);
                }}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-full font-medium hover:shadow-lg transition-all duration-300 flex items-center"
              >
                <i className="fas fa-plus mr-2"></i> เพิ่มห้องพักใหม่
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRooms.map((r) => {
              const statusBadge = getStatusBadge(r.status);
              const imageSrc = Array.isArray(r.images)
                ? r.images.length > 0
                  ? r.images[0].startsWith("http")
                    ? r.images[0]
                    : `http://localhost:5000${r.images[0]}`
                  : "/default-room.jpg"
                : r.images
                ? r.images.startsWith("http")
                  ? r.images
                  : `http://localhost:5000${r.images}`
                : "/default-room.jpg";

              return (
                <div
                  key={r.id}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1"
                >
                  {/* Room Image */}
                  <div className="h-48 overflow-hidden relative">
                    <img
                      src={imageSrc}
                      alt={r.name}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                    />

                    {/* Status Badge */}
                    <div className="absolute top-2 left-2">
                      <span
                        className={`${statusBadge.bgColor} ${statusBadge.textColor} px-3 py-1 rounded-full text-xs font-medium`}
                      >
                        {statusBadge.text}
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
                        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                          <p className="text-gray-600 text-sm">
                            รหัส: {r.code} -{" "}
                            {r.billing_cycle
                              ? r.billing_cycle === "monthly"
                                ? "รายเดือน"
                                : "รายเทอม"
                              : "ว่าง"}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setEditData(r);
                            setModalOpen(true);
                          }}
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
                            ไม่มีประเภทห้องพิเศษ
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                      <div className="text-xs text-gray-500">ID: {r.id}</div>
                      <div className="text-xs text-gray-500">
                        สร้างเมื่อ:{" "}
                        {new Date(r.created_at).toLocaleDateString("th-TH")}
                      </div>
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg transform transition-all duration-300 scale-95 animate-scaleIn">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold font-kanit">
                  {editData?.id ? "แก้ไขห้องพัก" : "เพิ่มห้องพักใหม่"}
                </h2>
                <button
                  onClick={() => {
                    setModalOpen(false);
                    setEditData(null);
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ชื่อห้อง
                  </label>
                  <input
                    type="text"
                    placeholder="ชื่อห้อง"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={editData?.name || ""}
                    onChange={(e) =>
                      setEditData({ ...editData, name: e.target.value })
                    }
                    required
                  />
                </div>
                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    รหัสห้อง
                  </label>
                  <input
                    type="text"
                    placeholder="รหัสห้อง"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={editData?.code || ""}
                    onChange={(e) =>
                      setEditData({ ...editData, code: e.target.value })
                    }
                    required
                  />
                </div> */}
                <div className="grid grid-cols-2 gap-4">
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
                        placeholder="0"
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        value={editData?.price_monthly || ""}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            price_monthly: e.target.value,
                          })
                        }
                        min="0"
                        step="0.01"
                      />
                    </div>
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
                        placeholder="0"
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        value={editData?.price_term || ""}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            price_term: e.target.value,
                          })
                        }
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ประเภทห้อง
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        checked={editData?.has_ac == 1}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
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
                        checked={editData?.has_fan == 1}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            has_fan: e.target.checked ? 1 : 0,
                          })
                        }
                      />
                      <span className="ml-2 text-sm text-gray-700">พัดลม</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    รายละเอียดห้องพัก
                  </label>
                  <textarea
                    placeholder="รายละเอียดเกี่ยวกับห้องพัก เช่น ขนาดห้อง, จำนวนผู้อยู่อาศัยที่รองรับ, ประเภทห้องอื่นๆ"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    rows="3"
                    value={editData?.description || ""}
                    onChange={(e) =>
                      setEditData({ ...editData, description: e.target.value })
                    }
                  ></textarea>
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setModalOpen(false);
                      setEditData(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:shadow-md transition-all duration-300"
                  >
                    {editData?.id ? "อัปเดต" : "บันทึก"}
                  </button>
                </div>
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
                คุณแน่ใจหรือไม่ที่จะลบห้อง{" "}
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

export default ManageRooms;

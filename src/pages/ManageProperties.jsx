// src/pages/ManageProperties.jsx
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Layout from "../components/Layout";
import API from "../api";

const ManageProperties = () => {
  const [properties, setProperties] = useState([]);
  const [owners, setOwners] = useState([]);
  const [search, setSearch] = useState("");
  const location = useLocation();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [editData, setEditData] = useState({
    id: null,
    name: "",
    address: "",
    description: "",
    image: "",
    imageFile: null,
    imageTab: "url",
    owner_ids: [],
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("add") === "true") {
      setEditData({
        name: "",
        address: "",
        description: "",
        image: "",
        imageFile: null,
        imageTab: "url",
        owner_ids: [],
      });
      setModalOpen(true);
    }
  }, [location]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const res = await API.get("/properties/admin");
      setProperties(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOwner = async () => {
    try {
      const res = await API.get("/users/owners");
      setOwners(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProperties();
    fetchOwner();
  }, []);

  useEffect(() => {
    if (modalOpen) {
      setEditData((prev) => ({
        id: prev?.id ?? null,
        name: prev?.name ?? "",
        address: prev?.address ?? "",
        description: prev?.description ?? "",
        image: prev?.image ?? "",
        imageFile: prev?.imageFile ?? null,
        imageTab: prev?.imageTab ?? "url",
        owner_ids: prev?.owner_ids ?? [],
      }));
    }
  }, [modalOpen]);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });

    // ซ่อน toast หลังจาก 3 วินาที
    setTimeout(() => {
      setToast({ show: false, message: "", type: "" });
    }, 3000);
  };

  const handleSave = async () => {
    try {
      if (!editData?.name || editData.name.trim() === "") {
        showToast("กรุณากรอกชื่ออสังหาริมทรัพย์", "error");
        return;
      }
      if (!editData?.address || editData.address.trim() === "") {
        showToast("กรุณากรอกที่อยู่", "error");
        return;
      }
      if (!editData?.description || editData.description.trim() === "") {
        showToast("กรุณากรอกคำอธิบาย", "error");
        return;
      }
      if (!editData?.owner_ids || editData.owner_ids.length === 0) {
        showToast("กรุณาเลือกเจ้าของอสังหาริมทรัพย์", "error");
        return;
      }

      const formData = new FormData();
      formData.append("name", editData.name);
      formData.append("address", editData.address);
      formData.append("description", editData.description || "");
      formData.append("owner_ids", JSON.stringify(editData.owner_ids || []));

      // ถ้าเลือก tab URL
      if (editData.imageTab === "url" && editData.image) {
        formData.append("image", editData.image);
      }

      // ถ้าเลือก tab Upload
      if (editData.imageTab === "upload" && editData.imageFile) {
        formData.append("imageFile", editData.imageFile); // ต้องเก็บ file จริง
      }

      if (editData?.id) {
        await API.put(`/properties/${editData.id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showToast("อัปเดตข้อมูลอสังหาริมทรัพย์สำเร็จ", "success");
      } else {
        await API.post("/properties", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showToast("เพิ่มอสังหาริมทรัพย์สำเร็จ", "success");
      }

      setModalOpen(false);
      setEditData({
        name: "",
        address: "",
        description: "",
        image: "",
        imageFile: null,
        imageTab: "url",
        owner_ids: [],
      });

      fetchProperties();
    } catch (err) {
      console.error(err);
      showToast(
        err.response?.data?.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
        "error"
      );
    }
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/properties/${id}`);
      showToast("ลบอสังหาริมทรัพย์สำเร็จ", "success");
      setDeleteConfirm(null);
      fetchProperties();
    } catch (err) {
      console.error(err);
      showToast("เกิดข้อผิดพลาดในการลบข้อมูล", "error");
    }
  };

  // ปรับปรุงฟังก์ชัน getOwnerNames เพื่อรองรับทั้งข้อมูลจาก owners และ owner_ids
  const getOwnerNames = (property) => {
    // ถ้ามีข้อมูล owners จาก API ให้ใช้ข้อมูลนี้ก่อน
    if (
      property.owners &&
      Array.isArray(property.owners) &&
      property.owners.length > 0
    ) {
      return property.owners.map((owner) => owner.username).join(", ");
    }

    // ถ้าไม่มีข้อมูล owners แต่มี owner_ids ให้ใช้ข้อมูลจาก owners state
    if (
      property.owner_ids &&
      Array.isArray(property.owner_ids) &&
      property.owner_ids.length > 0
    ) {
      return property.owner_ids
        .map((id) => {
          const owner = owners.find((o) => o.id === id);
          return owner ? owner.username : "ไม่ทราบ";
        })
        .join(", ");
    }

    // ถ้ามี owner_id เดี่ยว (เก่า) ให้แสดง
    if (property.owner_id) {
      const owner = owners.find((o) => o.id === property.owner_id);
      return owner ? owner.username : "ไม่ทราบ";
    }

    return "ไม่มีเจ้าของ";
  };

  // ปรับปรุงฟังก์ชัน filteredProperties เพื่อรองรับการค้นหาชื่อเจ้าของ
  const filteredProperties = properties.filter((p) => {
    const q = search.toLowerCase();
    const ownerNames = getOwnerNames(p);

    return (
      p.name.toLowerCase().includes(q) ||
      ownerNames.toLowerCase().includes(q) ||
      (p.address && p.address.toLowerCase().includes(q))
    );
  });

  const uniqueProperty = Array.from(
    new Map(filteredProperties.map((s) => [s.id, s])).values()
  );

  const OwnerMultiSelect = ({ owners, selectedOwners, onChange }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [isOpen, setIsOpen] = useState(false);

    const filteredOwners = owners.filter((owner) =>
      owner.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleOwner = (ownerId) => {
      const newSelected = selectedOwners.includes(ownerId)
        ? selectedOwners.filter((id) => id !== ownerId)
        : [...selectedOwners, ownerId];
      onChange(newSelected);
    };

    const getOwnerName = (ownerId) => {
      const owner = owners.find((o) => o.id === ownerId);
      return owner ? owner.username : "";
    };

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (event.target.closest(".owner-multiselect") === null) {
          setIsOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);

    return (
      <div className="relative owner-multiselect">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          เจ้าของ <span className="text-red-500">*</span>
        </label>
        <div
          className="min-h-[42px] border border-gray-300 rounded-lg p-2 cursor-pointer bg-white"
          onClick={() => setIsOpen(!isOpen)}
        >
          {selectedOwners.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {selectedOwners.map((id) => {
                const name = getOwnerName(id);
                return (
                  name && (
                    <span
                      key={id}
                      className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded"
                    >
                      {name}
                    </span>
                  )
                );
              })}
            </div>
          ) : (
            <span className="text-gray-500">เลือกเจ้าของ...</span>
          )}
        </div>

        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
            <div className="p-2 border-b">
              <input
                type="text"
                placeholder="ค้นหาเจ้าของ..."
                className="w-full p-2 border border-gray-300 rounded"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className="max-h-60 overflow-y-auto">
              {filteredOwners.length > 0 ? (
                filteredOwners.map((owner) => (
                  <div
                    key={owner.id}
                    className="flex items-center p-2 hover:bg-gray-100 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleOwner(owner.id);
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedOwners.includes(owner.id)}
                      onChange={() => toggleOwner(owner.id)}
                      className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span>{owner.username}</span>
                  </div>
                ))
              ) : (
                <div className="p-2 text-gray-500">ไม่พบเจ้าของ</div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

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
      <div className="sticky top-0 z-10 bg-pink-400 text-white shadow-lg pb-4 pt-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-kanit mb-1">
                จัดการอสังหาริมทรัพย์
              </h1>
              <p className="text-indigo-100 text-sm">
                จัดการข้อมูลอสังหาริมทรัพย์ทั้งหมดในระบบ
              </p>
            </div>
            <button
              onClick={() => {
                setEditData({
                  name: "",
                  owner_ids: [],
                  address: "",
                  image: "",
                  description: "",
                });
                setModalOpen(true);
              }}
              className="mt-3 sm:mt-0 bg-white text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center shadow-md hover:shadow-lg"
            >
              <i className="fas fa-plus mr-2"></i> เพิ่มอสังหาริมทรัพย์ใหม่
            </button>
          </div>

          {/* Search Bar - ย้ายมาไว้ตรงนี้ */}
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="ค้นหาอสังหาริมทรัพย์..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-800"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              <i className="fas fa-search"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-h-[calc(95vh-120px)] overflow-y-auto bg-pink-50 p-4 md:p-6">
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
              {search
                ? "ไม่พบอสังหาริมทรัพย์ที่ค้นหา"
                : "ยังไม่มีอสังหาริมทรัพย์"}
            </h3>
            <p className="text-gray-600 mb-6 max-w-md text-center">
              {search
                ? "ลองค้นหาด้วยคำอื่นหรือตรวจสอบการสะกด"
                : "เริ่มต้นโดยการเพิ่มอสังหาริมทรัพย์แรก"}
            </p>
            {!search && (
              <button
                onClick={() => {
                  setEditData({
                    name: "",
                    owner_ids: [],
                    address: "",
                    image: "",
                    description: "",
                  });
                  setModalOpen(true);
                }}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-full font-medium hover:shadow-lg transition-all duration-300 flex items-center"
              >
                <i className="fas fa-plus mr-2"></i> เพิ่มอสังหาริมทรัพย์ใหม่
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {uniqueProperty.map((p) => (
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
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-bold font-kanit text-gray-800">
                      {p.name ?? ""}
                    </h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setEditData({
                            ...p,
                            owner_ids: p.owners
                              ? p.owners.map((o) => o.id)
                              : p.owner_ids || [],
                          });
                          setModalOpen(true);
                        }}
                        className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 hover:bg-yellow-200 transition-colors duration-200"
                        title="แก้ไข"
                      >
                        <i className="fas fa-edit text-sm"></i>
                      </button>

                      <button
                        onClick={() => setDeleteConfirm(p)}
                        className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 hover:bg-red-200 transition-colors duration-200"
                        title="ลบ"
                      >
                        <i className="fas fa-trash-alt text-sm"></i>
                      </button>
                    </div>
                  </div>
                  <div className="mb-3">
                    <p className="text-gray-600 text-sm flex items-center">
                      <i className="fas fa-user mr-2 text-indigo-500"></i>
                      {getOwnerNames(p) || "ยังไม่มีเจ้าของ"}
                    </p>
                  </div>
                  <div className="mb-4">
                    <p className="text-gray-600 text-sm flex items-start">
                      <i className="fas fa-map-marker-alt mr-2 text-indigo-500 mt-1"></i>
                      {p.address ?? ""}
                    </p>
                  </div>
                  {p.description && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        รายละเอียด
                      </p>
                      <p className="text-gray-600 text-sm line-clamp-2">
                        {p.description || ""}
                      </p>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                    <div className="text-xs text-gray-500">
                      ID: {p.id || ""}
                    </div>
                    <button
                      onClick={() => {
                        setDetailData(p); // เก็บข้อมูลอสังหาริมทรัพย์ที่ต้องการดู
                        setDetailModalOpen(true);
                      }}
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
      {/* แก้ไข เพิ่ม */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[80vh] overflow-y-auto transform transition-all duration-300 scale-95 animate-scaleIn">
            <div className="p-6">
              {/* Header -->*/}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold font-kanit text-gray-800">
                  {editData?.id
                    ? "แก้ไขอสังหาริมทรัพย์"
                    : "เพิ่มอสังหาริมทรัพย์ใหม่"}
                </h2>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>

              {/* Form Content */}
              <div className="space-y-6">
                {/* Property Name Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ชื่ออสังหาริมทรัพย์ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={editData?.name || ""}
                    onChange={(e) =>
                      setEditData({ ...editData, name: e.target.value })
                    }
                    required
                  />
                </div>

                <OwnerMultiSelect
                  owners={owners}
                  selectedOwners={editData?.owner_ids || []}
                  onChange={(owner_ids) =>
                    setEditData({ ...editData, owner_ids })
                  }
                />

                {/* Address Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ที่อยู่ <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={editData?.address || ""}
                    onChange={(e) =>
                      setEditData({ ...editData, address: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                    rows="3"
                    required
                  />
                </div>

                {/* Image Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    รูปภาพ <span className="text-red-500">*</span>
                  </label>

                  {/* Tabs */}
                  <div className="flex mb-4">
                    <button
                      type="button"
                      className={`px-4 py-2 rounded-l-lg border border-gray-300 transition-colors duration-200 ${
                        editData?.imageTab === "url"
                          ? "bg-indigo-500 text-white"
                          : "bg-gray-100 text-gray-700"
                      }`}
                      onClick={() =>
                        setEditData({ ...editData, imageTab: "url" })
                      }
                    >
                      URL
                    </button>
                    <button
                      type="button"
                      className={`px-4 py-2 rounded-r-lg border border-gray-300 border-l-0 transition-colors duration-200 ${
                        editData?.imageTab === "upload"
                          ? "bg-indigo-500 text-white"
                          : "bg-gray-100 text-gray-700"
                      }`}
                      onClick={() =>
                        setEditData({ ...editData, imageTab: "upload" })
                      }
                    >
                      อัปโหลด
                    </button>
                  </div>

                  {/* Image Input Area */}
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    {editData?.imageTab === "url" ? (
                      <input
                        type="text"
                        value={editData?.image ?? ""}
                        onChange={(e) =>
                          setEditData({ ...editData, image: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="https://example.com/image.jpg"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-lg bg-white">
                        <div className="text-center">
                          <i className="fas fa-cloud-upload-alt text-3xl text-gray-400 mb-2"></i>
                          <p className="text-gray-500">
                            คลิกเพื่ออัปโหลดรูปภาพ
                          </p>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                setEditData({
                                  ...editData,
                                  imageFile: file,
                                });
                                const previewURL = URL.createObjectURL(file);
                                setEditData((prev) => ({
                                  ...prev,
                                  image: previewURL,
                                }));
                              }
                            }}
                            className="hidden"
                            id="imageUploadInput"
                          />
                          <label
                            htmlFor="imageUploadInput"
                            className="cursor-pointer block mt-2"
                          >
                            <span className="inline-flex items-center px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-colors duration-200">
                              <i className="fas fa-upload mr-2"></i>
                              เลือกรูปภาพ
                            </span>
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Image Preview */}
                    {editData?.image && (
                      <div className="mt-4">
                        <img
                          src={(() => {
                            if (!editData.image) return "/default-dorm.jpg";

                            if (typeof editData.image === "string") {
                              if (
                                editData.image.startsWith("http") ||
                                editData.image.startsWith("https")
                              ) {
                                return editData.image; // URL ภายนอก
                              }
                              if (editData.image.startsWith("/uploads")) {
                                return `http://localhost:5000${editData.image}`; // path backend
                              }
                              return editData.image; // fallback สำหรับ string อื่น ๆ
                            }

                            if (editData.image instanceof File) {
                              return URL.createObjectURL(editData.image);
                            }

                            return "/default-dorm.jpg"; // default fallback
                          })()}
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
                </div>

                {/* Description Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    รายละเอียด <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={editData?.description || ""}
                    onChange={(e) =>
                      setEditData({ ...editData, description: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                    rows="4"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setModalOpen(false)}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200 font-medium"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    {editData?.id ? "อัปเดต" : "บันทึก"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* รายละเอียด */}
      {detailModalOpen && detailData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[85vh] overflow-y-auto transform transition-all duration-300 scale-95 animate-scaleIn">
            <div className="bg-pink-50 p-6">
              {/* Header with gradient background */}
              <div className="bg-pink-400 text-white p-4 rounded-t-2xl flex justify-between items-center">
                <h2 className="text-2xl font-bold font-kanit">
                  รายละเอียดอสังหาริมทรัพย์
                </h2>
                <button
                  onClick={() => setDetailModalOpen(false)}
                  className="text-white hover:text-gray-200 transition-colors duration-200"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>

              {/* Content with modern card layout */}
              <div className="p-6 space-y-6">
                {/* Property Image Section */}
                <div className="rounded-xl overflow-hidden shadow-lg">
                  <img
                    src={
                      detailData.image
                        ? typeof detailData.image === "string"
                          ? detailData.image.startsWith("http")
                            ? detailData.image
                            : `http://localhost:5000${detailData.image}`
                          : URL.createObjectURL(detailData.image)
                        : "/default-dorm.jpg"
                    }
                    alt={detailData.name}
                    className="w-full h-96 object-cover"
                  />
                </div>

                {/* Property Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Info Card */}
                  <div className="bg-gray-50 rounded-xl p-6 shadow-sm">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">
                      ข้อมูลพื้นฐาน
                    </h3>

                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <i className="fas fa-home text-indigo-500 mt-1"></i>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">
                            ชื่ออสังหาริมทรัพย์
                          </label>
                          <p className="text-lg font-semibold text-gray-800">
                            {detailData.name}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <i className="fas fa-users text-indigo-500 mt-1"></i>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">
                            เจ้าของ
                          </label>
                          <p className="text-gray-800">
                            {getOwnerNames(detailData)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <i className="fas fa-map-marker-alt text-indigo-500 mt-1"></i>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">
                            ที่อยู่
                          </label>
                          <p className="text-gray-800">{detailData.address}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Info Card */}
                  <div className="bg-gray-50 rounded-xl p-6 shadow-sm">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">
                      รายละเอียดเพิ่มเติม
                    </h3>

                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <i className="fas fa-hashtag text-indigo-500 mt-1"></i>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">
                            รหัส อสังหาริมทรัพย์
                          </label>
                          <p className="text-gray-800">{detailData.id}</p>
                        </div>
                      </div>

                      {detailData.description && (
                        <div className="flex items-start space-x-3">
                          <i className="fas fa-file-alt text-indigo-500 mt-1"></i>
                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">
                              รายละเอียด
                            </label>
                            <p className="text-gray-800 whitespace-pre-line">
                              {detailData.description}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
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
                  {deleteConfirm.name}
                </span>
                ?
                <br />
                <span className="text-sm text-gray-500">
                  การดำเนินการนี้ไม่สามารถย้อนกลับได้
                </span>
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm.id)}
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

export default ManageProperties;

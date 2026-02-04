// src/pages/ManagePackages.jsx
import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import API from "../api";
import Select from "react-select";

const ManagePackages = ({ role }) => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, pending, received
  const [search, setSearch] = useState("");
  const [properties, setProperties] = useState([]);
  const [receiverProperty, setReceiverProperty] = useState(null);

  // State for modals
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentPackage, setCurrentPackage] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState(null);
  // State สำหรับผู้รับ
  const [receivers, setReceivers] = useState([]); // จาก backend
  const [selectedReceivers, setSelectedReceivers] = useState(
    role === "tenant" ? [] : []
  );

  // Form states
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    price: "",
    property_id: "",
  });
  const [addForm, setAddForm] = useState({
    name: "",
    description: "",
    price: "",
    property_id: "",
  });

  useEffect(() => {
    const fetchReceivers = async () => {
      try {
        const res = await API.get("/users/package-receivers");
        setReceivers(res.data.map((u) => ({ value: u.id, label: u.fullname })));
        if (role === "tenant") {
          setSelectedReceivers(
            res.data.map((u) => ({ value: u.id, label: u.fullname }))
          );
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchReceivers();
  }, [role]);

  // ดึงหอของผู้เช่าเมื่อ selectedReceivers เปลี่ยน
  useEffect(() => {
    const fetchReceiverProperty = async () => {
      if (selectedReceivers.length > 0) {
        const userId = selectedReceivers[0].value;
        try {
          const res = await API.get(`/users/${userId}/property`);
          setReceiverProperty(res.data); // { id, name }
        } catch (err) {
          console.error("[fetchReceiverProperty] API error:", err);
          setReceiverProperty(null);
        }
      } else {
        setReceiverProperty(null);
      }
    };
    fetchReceiverProperty();
  }, [selectedReceivers]);

  // ดึง packages และ properties
  useEffect(() => {
    const fetchPackagesAndProperties = async () => {
      try {
        setLoading(true);
        const [pkgRes, propRes] = await Promise.all([
          API.get("/packages"),
          API.get("/properties/my"),
        ]);
        setPackages(pkgRes.data);
        setProperties(propRes.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchPackagesAndProperties();
  }, []);

  const formatDate = (date) =>
    new Date(date).toLocaleString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const openDeleteModal = (pkg) => {
    setPackageToDelete(pkg);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/packages/${packageToDelete.id}`);
      setPackages(packages.filter((pkg) => pkg.id !== packageToDelete.id));
      setShowDeleteModal(false);
      showSuccessModalWithMessage("ลบพัสดุเรียบร้อยแล้ว");
    } catch {
      setShowDeleteModal(false);
      showErrorModalWithMessage("เกิดข้อผิดพลาดในการลบพัสดุ");
    }
  };

  const openEditModal = (pkg) => {
    setCurrentPackage(pkg);
    setEditForm({
      name: pkg.name,
      description: pkg.description,
      price: pkg.price || "",
      property_id: pkg.property_id || "",
    });

    // ดึง receivers ของพัสดุมาแสดง
    const preSelectedReceivers = pkg.user_id
      ? [{ value: pkg.user_id, label: pkg.user_fullname }]
      : [];
    setSelectedReceivers(preSelectedReceivers);
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedReceivers.length === 0) {
        showErrorModalWithMessage("กรุณาเลือกผู้รับพัสดุ");
        return;
      }

      await API.put(`/packages/${currentPackage.id}`, {
        ...editForm,
        user_id: selectedReceivers[0].value, // แปลงเป็น user_id ตรงๆ
      });

      // update local state
      setPackages(
        packages.map((pkg) =>
          pkg.id === currentPackage.id
            ? {
                ...pkg,
                ...editForm,
                user_id: selectedReceivers[0].value,
                user_fullname: selectedReceivers[0].label,
              }
            : pkg
        )
      );

      setShowEditModal(false);
      showSuccessModalWithMessage("แก้ไขพัสดุสำเร็จ!");
    } catch {
      showErrorModalWithMessage("เกิดข้อผิดพลาดในการแก้ไขพัสดุ");
    }
  };

  const openAddModal = () => {
    setAddForm({ name: "", description: "", price: "", property_id: "" });
    setSelectedReceivers(role === "tenant" ? [] : []); // รีเซ็ตค่า
    setShowAddModal(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...addForm,
        user_id:
          selectedReceivers.length > 0 ? selectedReceivers[0].value : null,
        property_id: receiverProperty
          ? receiverProperty.id
          : addForm.property_id || null, // fallback ถ้าไม่มี
      };

      await API.post("/packages", payload);

      // ดึง packages ใหม่
      const res = await API.get("/packages");
      setPackages(res.data);

      setShowAddModal(false);
      showSuccessModalWithMessage("เพิ่มพัสดุสำเร็จ!");
    } catch (err) {
      console.error("Error adding package:", err);
      showErrorModalWithMessage("เกิดข้อผิดพลาดในการเพิ่มพัสดุ");
    }
  };

  const handleNotifyPackage = async (pkg) => {
    try {
      await API.post(`/packages/notify/${pkg.id}`);
      showSuccessModalWithMessage("ส่งแจ้งเตือนพัสดุเรียบร้อยแล้ว");
    } catch (err) {
      console.error(err);
      showErrorModalWithMessage("เกิดข้อผิดพลาดในการส่งแจ้งเตือน");
    }
  };

  const showSuccessModalWithMessage = (message) => {
    setSuccessMessage(message);
    setShowSuccessModal(true);
  };

  const showErrorModalWithMessage = (message) => {
    setErrorMessage(message);
    setShowErrorModal(true);
  };

  const closeModal = () => {
    setShowSuccessModal(false);
    setShowErrorModal(false);
    setShowEditModal(false);
    setShowAddModal(false);

    // รีเซ็ตค่าฟอร์มและผู้รับ
    setCurrentPackage(null);
    setEditForm({ name: "", description: "", price: "", property_id: "" });
    setAddForm({ name: "", description: "", price: "", property_id: "" });
    setSelectedReceivers(role === "tenant" ? [] : []);
    setReceiverProperty(null); // รีเซ็ตค่าหอ
  };

  const filteredPackages = packages.filter((pkg) => {
    if (filter !== "all" && pkg.status !== filter) return false;
    if (search && !pkg.name.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "received":
        return {
          text: "รับแล้ว",
          bgColor: "bg-green-100",
          textColor: "text-green-800",
          icon: "fas fa-check-circle",
        };
      case "pending":
      default:
        return {
          text: "ยังไม่ได้รับ",
          bgColor: "bg-yellow-100",
          textColor: "text-yellow-800",
          icon: "fas fa-clock",
        };
    }
  };

  return (
    <Layout role={role} showFooter={false} showNav={false}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-lime-400 text-white shadow-lg pb-6 pt-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center">
          <h1 className="text-2xl md:text-3xl font-bold font-kanit">
            จัดการพัสดุ
          </h1>

          <div className="flex items-center space-x-2 mt-2 sm:mt-0">
            <input
              type="text"
              placeholder="ค้นหาชื่อพัสดุ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-3 py-1 rounded-md text-gray-800 focus:outline-none"
            />
            <div className="bg-white bg-opacity-20 rounded-lg p-1 flex">
              {["all", "pending", "received"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`py-1 px-3 rounded-md text-sm font-medium transition-colors duration-200 ${
                    filter === tab
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-white hover:bg-white hover:bg-opacity-10"
                  }`}
                >
                  {tab === "all"
                    ? "ทั้งหมด"
                    : tab === "pending"
                    ? "ยังไม่ได้รับ"
                    : "รับแล้ว"}
                </button>
              ))}
            </div>

            <button
              onClick={openAddModal}
              className="ml-2 bg-white text-indigo-600 px-4 py-1 rounded-md font-medium hover:bg-gray-100 transition-colors duration-200 flex items-center"
            >
              <i className="fas fa-plus mr-1"></i> เพิ่มพัสดุ
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-h-[calc(101vh-120px)] overflow-y-auto bg-lime-50 p-4 md:p-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl shadow-lg p-6 animate-pulse h-60"
              ></div>
            ))}
          </div>
        ) : filteredPackages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl shadow-lg">
            <div className="text-indigo-500 mb-4">
              <i className="fas fa-box-open text-5xl"></i>
            </div>
            <h3 className="text-xl font-bold font-kanit mb-2">ไม่พบพัสดุ</h3>
            <p className="text-gray-600 mb-6 max-w-md text-center">
              ไม่พบพัสดุตามเงื่อนไขที่เลือก
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredPackages.map((pkg) => {
              const statusBadge = getStatusBadge(pkg.status);
              return (
                <div
                  key={pkg.id}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1"
                >
                  {/* Header */}
                  <div className="p-5 bg-gradient-to-r from-indigo-50 to-purple-50 flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-bold font-kanit text-gray-800">
                        {pkg.user_fullname || "ไม่ระบุ"}
                      </h2>
                      <p className="text-gray-600 text-sm flex items-center mt-1">
                        <i className="fas fa-map-marker-alt mr-2 text-indigo-500"></i>
                        {pkg.property_name || "ไม่ระบุ"}
                      </p>
                    </div>
                    <div
                      className={`${statusBadge.bgColor} ${statusBadge.textColor} px-3 py-1 rounded-full text-xs font-medium flex items-center`}
                    >
                      <i className={`${statusBadge.icon} mr-1`}></i>
                      {statusBadge.text}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-5 space-y-3">
                    <p className="text-gray-700">{pkg.description}</p>
                    <p className="text-sm text-gray-600">
                      ชื่อพัสดุ : {pkg.name || "ไม่ระบุ"}
                    </p>
                    <div className="flex justify-between items-center">
                      {/* <p className="text-sm text-gray-600">
                        ราคา: {pkg.price ? `฿${pkg.price}` : "ไม่ระบุ"}
                      </p> */}
                      <div>
                      <p className="text-sm text-gray-600">
                        วันที่บันทึก: {formatDate(pkg.created_at)}
                      </p>
                      <p className="text-sm text-gray-600">
                        วันที่รับ: {pkg.received_at ? formatDate(pkg.received_at) : "-"}
                      </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-2 mt-4">
                      {pkg.status !== "received" && (
                        <button
                          onClick={() => handleNotifyPackage(pkg)}
                          className="text-sm text-green-600 hover:text-green-800 flex items-center"
                        >
                          <i className="fas fa-paper-plane mr-1"></i>{" "}
                          แจ้งเตือนพัสดุ
                        </button>
                      )}

                      {pkg.status !== "received" && (
                        <button
                          onClick={() => openEditModal(pkg)}
                          className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                        >
                          <i className="fas fa-edit mr-1"></i> แก้ไข
                        </button>
                      )}
                      <button
                        onClick={() => openDeleteModal(pkg)}
                        className="text-sm text-red-600 hover:text-red-800 flex items-center"
                      >
                        <i className="fas fa-trash mr-1"></i> ลบ
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4 transform transition-all">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <i className="fas fa-check text-green-600 text-xl"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                สำเร็จ!
              </h3>
              <p className="text-gray-600">{successMessage}</p>
              <div className="mt-4">
                <button
                  onClick={closeModal}
                  className="w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition-colors duration-200"
                >
                  ตกลง
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4 transform transition-all">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <i className="fas fa-exclamation-triangle text-red-600 text-xl"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                ข้อผิดพลาด!
              </h3>
              <p className="text-gray-600">{errorMessage}</p>
              <div className="mt-4">
                <button
                  onClick={closeModal}
                  className="w-full bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 transition-colors duration-200"
                >
                  ตกลง
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4 transform transition-all">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">แก้ไขพัสดุ</h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ห้องพัก
                  </label>

                  <Select
                    isMulti={false} // ไม่ให้เลือกหลายคน
                    options={receivers} // ตัวเลือกจาก backend
                    value={selectedReceivers} // ค่าปัจจุบัน
                    onChange={(selected) =>
                      setSelectedReceivers(selected ? [selected] : [])
                    } // เก็บเป็น array 1 คน
                    isSearchable
                    placeholder="เลือกห้องพัก"
                    className="basic-single"
                    classNamePrefix="select"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ชื่อพัสดุ
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    รายละเอียด
                  </label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm({ ...editForm, description: e.target.value })
                    }
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  ></textarea>
                </div>
                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ราคา
                  </label>
                  <input
                    type="number"
                    value={editForm.price}
                    onChange={(e) =>
                      setEditForm({ ...editForm, price: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div> */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ทรัพย์สิน
                  </label>
                  {receiverProperty ? (
                    // แสดง readonly ถ้ามีผู้เช่าแล้ว
                    <input
                      type="text"
                      value={receiverProperty.name}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                    />
                  ) : (
                    // เลือกทรัพย์สินเองได้
                    <select
                      value={addForm.property_id || editForm.property_id}
                      onChange={(e) => {
                        receiverProperty
                          ? null
                          : role === "add"
                          ? setAddForm({
                              ...addForm,
                              property_id: e.target.value,
                            })
                          : setEditForm({
                              ...editForm,
                              property_id: e.target.value,
                            });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">เลือกทรัพย์สิน</option>
                      {properties.map((prop) => (
                        <option key={prop.id} value={prop.id}>
                          {prop.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  บันทึกการเปลี่ยนแปลง
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4 transform transition-all">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                เพิ่มพัสดุใหม่
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleAddSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ห้องพัก
                  </label>

                  <Select
                    isMulti={false} // ไม่ให้เลือกหลายคน
                    options={receivers} // ตัวเลือกจาก backend
                    value={selectedReceivers} // ค่าปัจจุบัน
                    onChange={(selected) =>
                      setSelectedReceivers(selected ? [selected] : [])
                    } // เก็บเป็น array 1 คน
                    isSearchable
                    placeholder="เลือกห้องพัก"
                    className="basic-single"
                    classNamePrefix="select"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ชื่อพัสดุ
                  </label>
                  <input
                    type="text"
                    value={addForm.name}
                    onChange={(e) =>
                      setAddForm({ ...addForm, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    รายละเอียด
                  </label>
                  <textarea
                    value={addForm.description}
                    onChange={(e) =>
                      setAddForm({ ...addForm, description: e.target.value })
                    }
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  ></textarea>
                </div>
                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ราคา
                  </label>
                  <input
                    type="number"
                    value={addForm.price}
                    onChange={(e) =>
                      setAddForm({ ...addForm, price: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div> */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    หอพัก
                  </label>
                  {receiverProperty ? (
                    // แสดง readonly ถ้ามีผู้เช่าแล้ว
                    <input
                      type="text"
                      value={receiverProperty.name}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                    />
                  ) : (
                    // เลือกทรัพย์สินเองได้
                    <select
                      value={addForm.property_id || editForm.property_id}
                      onChange={(e) => {
                        receiverProperty
                          ? null
                          : role === "add"
                          ? setAddForm({
                              ...addForm,
                              property_id: e.target.value,
                            })
                          : setEditForm({
                              ...editForm,
                              property_id: e.target.value,
                            });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">เลือกหอพัก</option>
                      {properties.map((prop) => (
                        <option key={prop.id} value={prop.id}>
                          {prop.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  เพิ่มพัสดุ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4 transform transition-all">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                ยืนยันการลบพัสดุ
              </h3>
              <p className="text-gray-600 mb-6">
                คุณต้องการลบพัสดุ "{packageToDelete.name}" จริงหรือไม่?
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
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

export default ManagePackages;

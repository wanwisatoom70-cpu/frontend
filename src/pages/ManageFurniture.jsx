// pages/ManageFurniture.jsx
import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import API from "../api";

const ManageFurniture = () => {
  const [furnitures, setFurnitures] = useState([]);
  const [properties, setProperties] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedFurniture, setSelectedFurniture] = useState(null);
  const [form, setForm] = useState({
    name: "",
    code: "",
    quantity: "",
    property_id: "",
    room_ids: [],
  });

  // Fetch furniture
  const fetchFurnitures = async () => {
    try {
      const res = await API.get("/furniture");
      setFurnitures(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProperties = async () => {
    try {
      const res = await API.get("/furniture/staff/properties");
      setProperties(res.data); // แสดงเฉพาะหอของ staff
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRooms = async (property_id) => {
    if (!property_id) return setRooms([]);
    try {
      const res = await API.get(`/furniture/rooms/byProperty/${property_id}`);
      setRooms(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchFurnitures();
    fetchProperties();
  }, []);

  // Handlers
  const openAddModal = () => {
    setSelectedFurniture(null);
    setForm({
      name: "",
      code: "",
      quantity: "",
      property_id: "",
      room_ids: [],
    });
    setRooms([]);
    setShowAddModal(true);
  };

  const openEditModal = (item) => {
    setSelectedFurniture(item);
    setForm({
      name: item.name,
      code: item.code,
      quantity: item.quantity,
      property_id: item.property_id,
      room_ids: [item.room_id],
    });
    fetchRooms(item.property_id);
    setShowEditModal(true);
  };

  const openDeleteModal = (item) => {
    setSelectedFurniture(item);
    setShowDeleteModal(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        room_id: form.room_ids[0],
      };
      await API.post("/furniture", payload);
      fetchFurnitures();
      setShowAddModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        room_id: form.room_ids[0],
      };
      await API.put(`/furniture/${selectedFurniture.id}`, payload);
      fetchFurnitures();
      setShowEditModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/furniture/${selectedFurniture.id}`);
      fetchFurnitures();
      setShowDeleteModal(false);
    } catch (err) {
      console.error(err);
    }
  };
  return (
    <Layout role="staff" showFooter={false} showNav={false}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-purple-400 text-white shadow-lg pb-6 pt-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center">
          <h1 className="text-3xl font-bold font-kanit flex items-center">
            <i className="fas fa-couch mr-3"></i> จัดการเฟอร์นิเจอร์
          </h1>
          <button
            onClick={openAddModal}
            className="mt-2 sm:mt-0 bg-white text-purple-600 px-4 py-1 rounded-md font-medium hover:bg-gray-100 transition-colors duration-200 flex items-center"
          >
            <i className="fas fa-plus mr-1"></i> เพิ่มเฟอร์นิเจอร์
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-h-[calc(101vh-120px)] overflow-y-auto bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 p-6">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
          ) : furnitures.length === 0 ? (
            <p className="text-gray-600 text-center py-10">
              ยังไม่มีข้อมูลเฟอร์นิเจอร์
            </p>
          ) : (
            furnitures.map((building, idx) => (
              <div
                key={idx}
                className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-6 border border-gray-100 mb-6"
              >
                <h2 className="text-xl font-bold text-purple-700 mb-3">
                  🏢 {building.property_name}
                </h2>
                {building.furnitures.length === 0 ? (
                  <p className="text-gray-500 italic text-center py-4">
                    ยังไม่มีข้อมูลเฟอร์นิเจอร์ในหอนี้
                  </p>
                ) : (
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-purple-100 text-purple-700">
                        <th className="py-3 px-4 text-left">
                          <i className="fas fa-table"></i> ชื่อ
                        </th>
                        <th className="py-3 px-4 text-left">
                          <i className="fas fa-door-closed"></i> รหัสห้อง
                        </th>
                        <th className="py-3 px-4 text-center">
                          <i className="fas fa-layer-group"></i> จำนวน
                        </th>
                        <th className="py-3 px-4 text-center">
                          <i className="fas fa-tools"></i> จัดการ
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {building.furnitures.map((item, i) => (
                        <tr
                          key={i}
                          className="border-b hover:bg-purple-50 transition-all"
                        >
                          <td className="py-3 px-4">{item.name}</td>
                          <td className="py-3 px-4">{item.room_code}</td>
                          <td className="py-3 px-4 text-center">
                            {item.quantity}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => openEditModal(item)}
                              className="px-3 py-1 text-sm rounded-full bg-indigo-100 text-indigo-700 hover:bg-indigo-200 mr-2"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              onClick={() => openDeleteModal(item)}
                              className="px-3 py-1 text-sm rounded-full bg-red-100 text-red-700 hover:bg-red-200"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <FurnitureModal
          title={showAddModal ? "เพิ่มเฟอร์นิเจอร์" : "แก้ไขเฟอร์นิเจอร์"}
          form={form}
          setForm={setForm}
          properties={properties}
          rooms={rooms}
          onPropertyChange={fetchRooms}
          selectedFurniture={selectedFurniture}
          onClose={() => {
            setShowAddModal(false);
            setShowEditModal(false);
          }}
          onSubmit={showAddModal ? handleAddSubmit : handleEditSubmit}
        />
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              ยืนยันการลบ
            </h3>
            <p className="text-gray-700 mb-6">
              คุณต้องการลบ "{selectedFurniture?.name}" หรือไม่?
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
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                ลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

// Reusable Modal Component
const FurnitureModal = ({
  title,
  form,
  setForm,
  properties,
  rooms,
  onPropertyChange,
  onClose,
  onSubmit,
  selectedFurniture,
}) => {
  const [roomCodeInput, setRoomCodeInput] = useState("");
  // ตั้งค่า roomCodeInput ตอน edit modal เปิด
  useEffect(() => {
    if (selectedFurniture && rooms.length > 0) {
      // Edit Modal เท่านั้น
      const room = rooms.find((r) => r.id === selectedFurniture.room_id);
      setRoomCodeInput(room ? room.code : "");
    } else {
      // Add Modal จะเป็นค่าว่าง
      setRoomCodeInput("");
    }
  }, [selectedFurniture, rooms]);

  const isFormValid =
    form.name.trim() !== "" &&
    form.quantity > 0 &&
    form.property_id &&
    form.room_ids.length > 0 &&
    form.room_ids[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4 transform transition-all">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ชื่อ
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              จำนวน
            </label>
            <input
              type="number"
              value={form.quantity}
              min={1}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              เลือกหอพัก
            </label>
            <select
              value={form.property_id}
              onChange={(e) => {
                setForm({ ...form, property_id: e.target.value, room_ids: [] });
                onPropertyChange(e.target.value);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500"
            >
              <option value="">-- เลือกหอพัก --</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {rooms.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                เลือกห้อง (ค้นหาด้วยห้อง)
              </label>
              <input
                list="room-list"
                value={roomCodeInput}
                onChange={(e) => {
                  setRoomCodeInput(e.target.value);
                  const room = rooms.find((r) => r.code === e.target.value);
                  if (room) setForm({ ...form, room_ids: [room.id] });
                }}
                placeholder="พิมพ์รหัสห้องเพื่อค้นหา..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500"
              />
              <datalist id="room-list">
                {rooms.map((r) => (
                  <option key={r.id} value={r.code}>
                    {r.code} - {r.name}
                  </option>
                ))}
              </datalist>
            </div>
          )}

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={!isFormValid} // ✅ ปิดถ้าไม่ครบ
              className={`px-4 py-2 rounded-md text-white ${
                isFormValid
                  ? "bg-purple-600 hover:bg-purple-700"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              บันทึก
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManageFurniture;

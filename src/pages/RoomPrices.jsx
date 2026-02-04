// src/pages/RoomPrices.jsx
import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import API from "../api";

const RoomPrices = () => {
  const [rooms, setRooms] = useState([]);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [form, setForm] = useState({
    booking_id: "",
    water_units: "",
    electric_units: "",
    other_charges: "",
    note: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bills, setBills] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [editingBillId, setEditingBillId] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    message: "",
    onConfirm: null,
  });

  useEffect(() => {
    API.get("/bills/prices")
      .then((res) => setRooms(res.data))
      .catch((err) => console.error(err));
  }, []);

  const openBillModal = (room, bill = null) => {
    setSelectedRoom(room);

    if (bill) {
      // โหมดแก้ไข
      setEditMode(true);
      setEditingBillId(bill.id);
      setForm({
        booking_id: bill.booking_id,
        water_units: bill.water_units,
        electric_units: bill.electric_units,
        other_charges: bill.other_charges,
        note: bill.note,
        include_room_price: bill.room_price > 0, // ถ้ามีค่าห้องให้ติ๊ก
      });
    } else {
      // โหมดเพิ่ม
      setEditMode(false);
      setEditingBillId(null);
      setForm({
        booking_id: room.booking_id,
        water_units: "",
        electric_units: "",
        other_charges: "",
        note: "",
        include_room_price: false,
      });
    }

    setModalOpen(true);
  };

  const openViewModal = async (room) => {
    setSelectedRoom(room);
    try {
      const res = await API.get(`/bills/byBooking/${room.booking_id}`);
      setBills(res.data);
    } catch (err) {
      console.error(err);
    }
    setViewModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editMode && editingBillId) {
        await API.put(`/bills/${editingBillId}`, form);
        showToast("✅ อัปเดตบิลสำเร็จ", "success");
      } else {
        await API.post("/bills/add", form);
        showToast("✅ บันทึกบิลสำเร็จ", "success");
      }

      setModalOpen(false);
      setForm({
        booking_id: "",
        water_units: "",
        electric_units: "",
        other_charges: "",
        note: "",
        include_room_price: false,
      });
      setEditMode(false);
      setEditingBillId(null);
      // รีเฟรชบิลถ้ามี viewModal เปิดอยู่
      if (selectedRoom) openViewModal(selectedRoom);
    } catch (err) {
      console.error(err);
      showToast("❌ เกิดข้อผิดพลาดในการบันทึกบิล", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredRooms = rooms.filter((room) => {
    if (!search.trim()) return true;
    const keyword = search.toLowerCase();
    return (
      room.property_name.toLowerCase().includes(keyword) ||
      room.name.toLowerCase().includes(keyword) ||
      room.code.toLowerCase().includes(keyword)
    );
  });

  const billing_cycleS = (billing_cycle) => {
    switch (billing_cycle) {
      case "monthly":
        return "รายเดือน";
      case "term":
        return "รายเทอม";
      default:
        return "ไม่มี";
    }
  };
  const translateStatus = (status) => {
    switch (status) {
      case "pending":
        return "รอยืนยัน";
      case "paid":
        return "ชำระแล้ว";
      case "unpaid":
        return "ยังไม่ชำระ";
      default:
        return "ยังไม่มีบิล";
    }
  };
  const statusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "paid":
        return "bg-green-100 text-green-800";
      case "unpaid":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const showToast = (message, type = "success") => {
    const id = Date.now();
    setToasts([...toasts, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000); // หายไปเองใน 3 วิ
  };

  return (
    <Layout showFooter={false} showNav={false}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg pb-6 pt-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center">
          <h1 className="text-2xl md:text-3xl font-bold font-kanit">
            จัดการค่าห้อง
          </h1>
          <div className="flex items-center space-x-2 mt-2 sm:mt-0">
            <input
              type="text"
              placeholder="ค้นหาหอ,ห้อง..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-3 py-1 rounded-md text-gray-800 focus:outline-none"
            />
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-auto bg-gradient-to-br from-indigo-50 to-purple-100 p-4 md:p-6">
        <div className="p-6">
          {filteredRooms.length > 0 ? (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <table className="min-w-full border border-gray-300 border-collapse">
                <thead className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                  <tr>
                    {[
                      { icon: "fa-building", label: "หอพัก" },
                      { icon: "fa-bed", label: "ห้อง" },
                      // { icon: "fa-key", label: "รหัส" },
                      { icon: "fa-calendar-week", label: "รายเดือน" },
                      { icon: "fa-calendar", label: "รายเทอม" },
                      { icon: "fa-receipt", label: "การแจ้งบิล" },
                    ].map((item) => (
                      <th
                        key={item.label}
                        className="px-6 py-3 text-left text-sm font-medium font-bold uppercase tracking-wider border border-gray-300"
                      >
                        <i className={`fas ${item.icon} mr-2`}></i>
                        {item.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {filteredRooms
                    .filter(
                      (room, index, self) =>
                        index ===
                        self.findIndex((r) => r.room_id === room.room_id)
                    )
                    .map((room, idx) => (
                      <tr
                        key={
                          room.room_id ? `room-${room.room_id}` : `room-${idx}`
                        }
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 border border-gray-200 text-sm font-medium text-gray-900">
                          {room.property_name}
                        </td>
                        <td className="px-6 py-4 border border-gray-200 text-sm text-gray-900">
                          {room.name}
                        </td>
                        {/* <td className="px-6 py-4 border border-gray-200 text-sm text-gray-900">
                          {room.code}
                        </td> */}
                        <td className="px-6 py-4 border border-gray-200 text-sm text-gray-900">
                          {room.price_monthly?.toLocaleString() || "-"}
                        </td>
                        <td className="px-6 py-4 border border-gray-200 text-sm text-gray-900">
                          {room.price_term?.toLocaleString() || "-"}
                        </td>
                        <td className="px-6 py-4 border border-gray-200 text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => openBillModal(room)}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-green-500 hover:bg-green-600 focus:outline-none"
                            >
                              <i className="fas fa-file-invoice mr-1"></i>
                              แจ้งบิล
                            </button>
                            <button
                              onClick={() => openViewModal(room)}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-blue-500 hover:bg-blue-600 focus:outline-none"
                            >
                              <i className="fas fa-eye mr-1"></i>
                              ดูบิล
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl shadow-lg">
              <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-6">
                <i className="fas fa-calendar-times text-indigo-500 text-4xl"></i>
              </div>
              <h3 className="text-xl font-bold font-kanit mb-2 text-gray-800">
                ไม่มีรายการห้องพัก
              </h3>
              <p className="text-gray-600 mb-6">
                {search.trim() ? "ไม่พบรายการที่ค้นหา" : "ยังไม่มีรายการในระบบ"}
              </p>
            </div>
          )}
        </div>
      </div>
      {/* Modal แจ้งบิล */}
      {modalOpen && selectedRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl p-6">
            <h2 className="text-xl font-bold mb-4">
              แจ้งบิล - {selectedRoom.name}
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <label className="block mb-1 flex items-center">
                    <i className="fas fa-building mr-2 text-primary"></i>
                    ชื่อหอ
                  </label>
                  <input
                    type="text"
                    value={selectedRoom.property_name || ""}
                    readOnly
                    className="w-full p-2 border rounded"
                  />
                </div>

                <div>
                  <label className="block mb-1 flex items-center">
                    <i className="fas fa-bed mr-2 text-primary"></i>
                    ชื่อห้อง
                  </label>
                  <input
                    type="text"
                    value={selectedRoom.name || ""}
                    readOnly
                    className="w-full p-2 border rounded"
                  />
                </div>

                <div>
                  <label className="block mb-1 flex items-center">
                    <i className="fas fa-key mr-2 text-primary"></i>
                    รหัสห้อง
                  </label>
                  <input
                    type="text"
                    value={selectedRoom.code || ""}
                    readOnly
                    className="w-full p-2 border rounded"
                  />
                </div>

                <div>
                  <label className="block mb-1 flex items-center">
                    <i className="fas fa-user mr-2 text-primary"></i>
                    ผู้เช่า
                  </label>
                  <input
                    type="text"
                    value={selectedRoom.user_fullname || ""}
                    readOnly
                    className="w-full p-2 border rounded"
                  />
                </div>

                <div>
                  <label className="block mb-1 flex items-center">
                    <i className="fas fa-dollar-sign mr-2 text-primary"></i>
                    ค่าห้อง{" "}
                    {selectedRoom.billing_cycle === "term"
                      ? "(รายเทอม)"
                      : "(รายเดือน)"}
                  </label>
                  <input
                    type="text"
                    value={(() => {
                      const price =
                        selectedRoom.billing_cycle === "term"
                          ? selectedRoom.price_term
                          : selectedRoom.price_monthly;

                      return price != null
                        ? Number(price).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        : "";
                    })()}
                    readOnly
                    className="w-full p-2 border rounded mb-1"
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div>
                  <label className="block mb-1 flex items-center">
                    <i className="fas fa-tint mr-2 text-blue-500"></i>
                    หน่วยน้ำที่ใช้
                  </label>
                  <input
                    type="number"
                    value={form.water_units}
                    onChange={(e) =>
                      setForm({ ...form, water_units: e.target.value })
                    }
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1 flex items-center">
                    <i className="fas fa-bolt mr-2 text-yellow-500"></i>
                    หน่วยไฟที่ใช้
                  </label>
                  <input
                    type="number"
                    value={form.electric_units}
                    onChange={(e) =>
                      setForm({ ...form, electric_units: e.target.value })
                    }
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1 flex items-center">
                    <i className="fas fa-plus mr-2 text-green-500"></i>
                    ค่าอื่น ๆ
                  </label>
                  <input
                    type="number"
                    value={form.other_charges}
                    onChange={(e) =>
                      setForm({ ...form, other_charges: e.target.value })
                    }
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div className="flex items-center gap-x-2">
                  <input
                    type="checkbox"
                    id="include_room_price"
                    checked={form.include_room_price || false}
                    onChange={(e) =>
                      setForm({ ...form, include_room_price: e.target.checked })
                    }
                    className="h-4 w-4"
                  />
                  <label htmlFor="include_room_price" className="text-gray-700">
                    รวมค่าห้อง
                  </label>
                </div>
                <input
                  type="text"
                  placeholder="หมายเหตุ"
                  value={form.note || ""}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>

              {/* Buttons (span across both columns) */}
              <div className="col-span-2 flex justify-end gap-x-2 mt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-gray-300 rounded flex items-center"
                >
                  <i className="fas fa-times mr-2"></i>
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center"
                >
                  {isSubmitting ? (
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                  ) : (
                    <i className="fas fa-save mr-2"></i>
                  )}
                  {isSubmitting
                    ? "กำลังบันทึก..."
                    : editMode
                    ? "อัปเดตบิล"
                    : "บันทึกบิล"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal ดูบิล - ปรับให้เป็น card สวยๆ และไม่มี scroll */}
      {viewModalOpen && selectedRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl p-6 overflow-hidden max-h-[90vh]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">
                บิลของห้อง {selectedRoom.name}
              </h2>
              <button
                onClick={() => setViewModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            {bills.length > 0 ? (
              <div className="overflow-x-auto max-h-[70vh] no-scrollbar">
                <div className="grid grid-cols-1 gap-4">
                  {bills.map((bill) => (
                    <div
                      key={bill.id}
                      className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {/* Row 1 -->*/}
                        <div className="flex items-start space-x-3">
                          <div className="bg-blue-100 p-2 rounded-lg">
                            <i className="fas fa-calendar-alt text-blue-500"></i>
                          </div>
                          <div>
                            <div className="font-medium text-gray-700">
                              วันที่ออกบิล
                            </div>
                            <div className="text-gray-600">
                              {new Date(bill.billing_date).toLocaleDateString(
                                "th-TH"
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="bg-blue-100 p-2 rounded-lg">
                            <i className="fas fa-calendar-alt text-blue-500"></i>
                          </div>
                          <div>
                            <div className="font-medium text-gray-700">
                              วันที่แก้ไขบิล
                            </div>
                            <div className="text-gray-600">
                              {bill.updated_at
                                ? new Date(bill.updated_at).toLocaleDateString(
                                    "th-TH"
                                  )
                                : "-"}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <div className="bg-purple-100 p-2 rounded-lg">
                            <i className="fas fa-sync-alt text-purple-500"></i>
                          </div>
                          <div>
                            <div className="font-medium text-gray-700">
                              ประเภทการเช่า
                            </div>
                            <div className="text-gray-600">
                              {billing_cycleS(bill.billing_cycle)}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <div className="bg-orange-100 p-2 rounded-lg">
                            <i className="fas fa-home text-orange-500"></i>
                          </div>
                          <div>
                            <div className="font-medium text-gray-700">
                              ค่าห้อง
                            </div>
                            <div className="text-gray-600">
                              {bill.room_price.toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="bg-gray-100 p-2 rounded-lg">
                            <i className="fas fa-sticky-note text-gray-500"></i>
                          </div>
                          <div>
                            <div className="font-medium text-gray-700">
                              หมายเหตุ
                            </div>
                            <div className="text-gray-600">
                              {bill.note || "-"}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Row 2 */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                        <div className="flex items-start space-x-3">
                          <div className="bg-blue-100 p-2 rounded-lg">
                            <i className="fas fa-tint text-blue-500"></i>
                          </div>
                          <div>
                            <div className="font-medium text-gray-700">
                              หน่วยน้ำที่ใช้น้ำ
                            </div>
                            <div className="text-gray-600">
                              {bill.water_units}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <div className="bg-yellow-100 p-2 rounded-lg">
                            <i className="fas fa-bolt text-yellow-500"></i>
                          </div>
                          <div>
                            <div className="font-medium text-gray-700">
                              หน่วยไฟที่ใช้
                            </div>
                            <div className="text-gray-600">
                              {bill.electric_units}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <div className="bg-green-100 p-2 rounded-lg">
                            <i className="fas fa-plus-circle text-green-500"></i>
                          </div>
                          <div>
                            <div className="font-medium text-gray-700">
                              ค่าอื่นๆ
                            </div>
                            <div className="text-gray-600">
                              {bill.other_charges.toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="bg-red-100 p-2 rounded-lg">
                            <i className="fas fa-calculator text-red-500"></i>
                          </div>
                          <div>
                            <div className="font-medium text-gray-700">รวม</div>
                            <div className="text-gray-600 font-semibold">
                              {bill.total_amount.toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="bg-blue-100 p-2 rounded-lg">
                            <i className="fas fa-calendar-alt text-blue-500"></i>
                          </div>
                          <div>
                            <div className="font-medium text-gray-700">
                              วันที่ชำระ
                            </div>
                            <div className="text-gray-600">
                              {bill.paid_at
                                ? new Date(bill.paid_at).toLocaleDateString(
                                    "th-TH"
                                  )
                                : "-"}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Status and Actions */}
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColor(
                              bill.status
                            )}`}
                          >
                            {translateStatus(bill.status)}
                          </span>
                          {bill.status === "pending" && (
                            <button
                              onClick={() => {
                                setSelectedBill(bill); // สร้าง state ใหม่ selectedBill
                                setConfirmModalOpen(true); // เปิด Modal ยืนยัน
                              }}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-500 hover:bg-blue-600 focus:outline-none transition duration-150 ease-in-out"
                            >
                              <i className="fas fa-check-circle mr-2"></i>
                              ยืนยัน
                            </button>
                          )}
                        </div>
                        {bill.status === "paid" && (
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-semibold `}
                          >
                            ยืนยันการชำระแล้ว -{" "}
                            {bill.created_at
                              ? new Date(bill.created_at).toLocaleDateString(
                                  "th-TH"
                                )
                              : "-"}
                          </span>
                        )}
                        {bill.status !== "paid" && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                openBillModal(selectedRoom, bill);
                                setViewModalOpen(false);
                              }}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none"
                            >
                              <i className="fas fa-edit mr-1"></i>
                              แก้ไข
                            </button>

                            <button
                              onClick={() => {
                                setConfirmModal({
                                  open: true,
                                  message:
                                    "ต้องการส่งบิลและแจ้งเตือนทาง LINE หรือไม่?",
                                  onConfirm: async () => {
                                    try {
                                      await API.post(`/bills/send/${bill.id}`);
                                      showToast(
                                        "✅ ส่งบิลและแจ้งเตือน LINE เรียบร้อยแล้ว",
                                        "success"
                                      );
                                      openViewModal(selectedRoom); // รีเฟรชบิล
                                    } catch (err) {
                                      console.error(err);
                                      showToast(
                                        "❌ เกิดข้อผิดพลาดในการส่งบิล",
                                        "error"
                                      );
                                    }
                                  },
                                });
                              }}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent 
                               text-sm font-medium rounded-md text-white bg-green-500 hover:bg-green-600 rounded-lg"
                            >
                              <i className="fas fa-paper-plane mr-1"></i>
                              ส่งบิล
                            </button>
                          </div>
                        )}
                        {bill.status === "paid" && (
                          <div className="flex space-x-2">
                            <button
                              onClick={async () => {
                                setConfirmModal({
                                  open: true,
                                  message: "คุณแน่ใจหรือไม่ที่จะลบบิลนี้?",
                                  onConfirm: async () => {
                                    try {
                                      await API.delete(`/bills/${bill.id}`);
                                      showToast("✅ ลบบิลเรียบร้อย", "success");
                                      openViewModal(selectedRoom); // รีเฟรชบิล
                                    } catch (err) {
                                      console.error(err);
                                      showToast(
                                        "❌ เกิดข้อผิดพลาดในการลบบิล",
                                        "error"
                                      );
                                    }
                                  },
                                });
                              }}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent 
                               text-sm font-medium rounded-md text-white bg-red-500 hover:bg-red-600"
                            >
                              <i className="fas fa-trash-alt mr-1"></i>
                              ลบ
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="mb-4">
                  <i className="fas fa-file-alt text-gray-400 text-5xl"></i>
                </div>
                <p className="text-gray-500 text-lg">
                  ยังไม่มีบิลสำหรับห้องนี้
                </p>
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setViewModalOpen(false)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
              >
                <i className="fas fa-times mr-2"></i>
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Confirm Payment Modal */}
      {confirmModalOpen && selectedBill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">
              ยืนยันการชำระเงิน
            </h2>
            <p className="mb-6 text-gray-600">
              คุณต้องการยืนยันการชำระเงินสำหรับบิลห้อง{" "}
              <span className="font-semibold">{selectedRoom.name}</span>{" "}
              หรือไม่?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmModalOpen(false)}
                className="px-4 py-2 bg-gray-300 rounded flex items-center"
              >
                <i className="fas fa-times mr-2"></i> ยกเลิก
              </button>
              <button
                onClick={async () => {
                  try {
                    await API.put(`/bills/confirm/${selectedBill.id}`);
                    showToast("✅ ยืนยันการชำระเงินเรียบร้อยแล้ว", "success");
                    setConfirmModalOpen(false);
                    openViewModal(selectedRoom);
                  } catch (err) {
                    console.error(err);
                    showToast("❌ เกิดข้อผิดพลาดในการยืนยันบิล", "error");
                  }
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center"
              >
                <i className="fas fa-check mr-2"></i> ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Confirm Modal */}
      {confirmModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm text-center">
            <i className="fas fa-exclamation-triangle text-yellow-500 text-4xl mb-4"></i>
            <p className="text-gray-700 mb-6">{confirmModal.message}</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() =>
                  setConfirmModal({ open: false, message: "", onConfirm: null })
                }
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                ยกเลิก
              </button>
              <button
                onClick={async () => {
                  if (confirmModal.onConfirm) {
                    await confirmModal.onConfirm();
                  }
                  setConfirmModal({
                    open: false,
                    message: "",
                    onConfirm: null,
                  });
                }}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Toast Container */}
      <div className="fixed top-4 right-4 space-y-2 z-[9999]">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-2 rounded shadow-lg text-white animate-fade-in-right
              ${toast.type === "success" ? "bg-green-500" : "bg-red-500"}`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </Layout>
  );
};

export default RoomPrices;

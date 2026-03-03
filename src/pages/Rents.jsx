// src/pages/Rents.jsx
import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import API from "../api";

const Rents = ({ role }) => {
  const [rents, setRents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, unpaid, paid
  const [modalMessage, setModalMessage] = useState(null);
  const [confirmRentId, setConfirmRentId] = useState(null);
  const [toast, setToast] = useState(null);
  const [selectedRent, setSelectedRent] = useState(null);

  useEffect(() => {
    const fetchRents = async () => {
      try {
        setLoading(true);
        const res = await API.get("/rent");

        // flatten ให้ได้ list ของ bills โดยแต่ละอันมีข้อมูลห้อง/booking มาด้วย
        const mapped = res.data.map((r) => ({
          booking_id: r.booking_id,
          room_name: r.room_name,
          property_name: r.property_name,
          status: r.bill ? r.bill.status : "unpaid",
          price: r.bill?.total_amount || 0,
          room_price: r.bill?.room_price || 0,
          water_units: r.bill?.water_units || 0,
          electric_units: r.bill?.electric_units || 0,
          created_at: r.bill?.billing_date || r.start_date,
          paid_at: r.bill?.paid_at || null,
          bill_id: r.bill?.id, // เก็บ bill id เอาไว้ใช้เป็น key
        }));

        setRents(mapped);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRents();
  }, []);

  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleString("th-TH", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "-";

  const updateRentStatus = async (billId) => {
    try {
      await API.put(`/rent/${billId}/pay`);
      const res = await API.get("/rent");
      const mapped = res.data.map((r) => ({
        booking_id: r.booking_id,
        room_name: r.room_name,
        property_name: r.property_name,
        status: r.bill ? r.bill.status : "unpaid",
        price: r.bill?.total_amount || 0,
        room_price: r.bill?.room_price || 0,
        water_units: r.bill?.water_units || 0,
        electric_units: r.bill?.electric_units || 0,
        created_at: r.bill?.billing_date || r.start_date,
        paid_at: r.bill?.paid_at || null,
        bill_id: r.bill?.id,
      }));
      setRents(mapped);
      showToast("✅ ชำระค่าเช่าสำเร็จ! รอยืนยันจากเจ้าหน้าที่", "success");
    } catch (err) {
      console.error(err);
      showToast("❌ เกิดข้อผิดพลาดในการอัปเดตสถานะค่าเช่า", "error");
    }
  };

  const filteredRents = rents.filter((r) => {
    if (filter === "all") return true;
    return r.status === filter;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "paid":
        return {
          text: "จ่ายแล้ว",
          bgColor: "bg-green-100",
          textColor: "text-green-800",
          icon: "fas fa-check-circle",
        };
      case "pending":
        return {
          text: "รอยืนยัน",
          bgColor: "bg-blue-100",
          textColor: "text-blue-800",
          icon: "fas fa-hourglass-half",
        };
      case "unpaid":
      default:
        return {
          text: "ยังไม่ได้จ่าย",
          bgColor: "bg-yellow-100",
          textColor: "text-yellow-800",
          icon: "fas fa-clock",
        };
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000); // หายไปหลัง 4 วินาที
  };

  return (
    <Layout role={role} showFooter={false} showNav={false}>
      {/* Header + Filter */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg pb-4 pt-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-kanit mb-1">
              ค่าเช่าของฉัน
            </h1>
            <p className="text-indigo-100 text-sm">
              จัดการการชำระค่าเช่าของคุณ
            </p>
          </div>
          <div className="mt-3 sm:mt-0 flex items-center space-x-2">
            <div className="bg-white bg-opacity-20 rounded-lg p-1 flex">
              {[
                { id: "all", label: "ทั้งหมด" },
                { id: "unpaid", label: "ยังไม่ได้จ่าย" },
                { id: "paid", label: "จ่ายแล้ว" },
                { id: "pending", label: "รอยืนยัน" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={`py-1 px-3 rounded-md text-sm font-medium transition-colors duration-200 ${
                    filter === tab.id
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-white hover:bg-white hover:bg-opacity-10"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 overflow-auto bg-gradient-to-br from-indigo-100 to-purple-130 p-4 md:p-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-lg p-6 animate-pulse"
              >
                <div className="h-6 w-3/4 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 w-1/2 bg-gray-200 rounded mb-6"></div>
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="h-4 w-full bg-gray-200 rounded"
                    ></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : filteredRents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl shadow-lg">
            <div className="text-indigo-500 mb-4">
              <i className="fas fa-receipt text-5xl"></i>
            </div>
            <h3 className="text-xl font-bold font-kanit mb-2">
              {filter === "all"
                ? "ไม่มีรายการค่าเช่า"
                : `ไม่มีรายการค่าเช่า${
                    filter === "unpaid" ? "ที่ยังไม่ได้จ่าย" : "ที่จ่ายแล้ว"
                  }`}
            </h3>
            <p className="text-gray-600 mb-6 max-w-md text-center">
              {filter === "all"
                ? "คุณยังไม่มีรายการค่าเช่า"
                : filter === "unpaid"
                ? "คุณชำระค่าเช่าทั้งหมดแล้ว"
                : "คุณยังไม่ได้ชำระค่าเช่าใดๆ"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredRents.map((rent) => {
              const statusBadge = getStatusBadge(rent.status);
              return (
                <div
                  key={rent.bill_id}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1"
                >
                  <div className="p-5 bg-gradient-to-r from-indigo-50 to-purple-50 flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-bold font-kanit text-gray-800">
                        ห้อง {rent.room_name}
                      </h2>
                      <p className="text-gray-600 text-sm flex items-center mt-1">
                        <i className="fas fa-building mr-2 text-indigo-500"></i>
                        {rent.property_name}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <div
                        className={`${statusBadge.bgColor} ${statusBadge.textColor} px-3 py-1 rounded-full text-xs font-medium flex items-center`}
                      >
                        <i className={`${statusBadge.icon} mr-1`}></i>
                        {statusBadge.text}
                      </div>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-1">
                        ยอดรวม
                      </h3>
                      <p className="text-lg font-bold text-indigo-600">
                        ฿
                        {rent.price.toLocaleString("th-TH", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-1">
                          วันที่บันทึก
                        </h3>
                        <p className="text-sm text-gray-600">
                          {formatDate(rent.created_at)}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-1">
                          วันที่จ่าย
                        </h3>
                        <p className="text-sm text-gray-600">
                          {rent.paid_at ? formatDate(rent.paid_at) : "-"}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-between mt-6">
                      <button
                        onClick={() => setSelectedRent(rent)}
                        className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center"
                      >
                        <i className="fas fa-info-circle mr-1"></i> ดูรายละเอียด
                      </button>                     
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {/* Modal สำหรับดูรายละเอียดค่าเช่า */}
      {selectedRent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-gradient-to-br from-purple-400 via-pink-400 to-indigo-400 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scaleIn">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-white/30">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <i className="fas fa-receipt mr-3 text-yellow-300"></i>{" "}
                รายละเอียดค่าเช่า
              </h2>
              <button
                onClick={() => setSelectedRent(null)}
                className="text-white hover:text-yellow-200"
              >
                <i className="fas fa-times text-2xl"></i>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5 bg-white rounded-b-3xl">
              {/* ห้องและอสังหาริมทรัพย์ */}
              <div className="p-4 bg-indigo-50 rounded-xl shadow-md">
                <p className="text-gray-500 text-sm">ห้อง</p>
                <p className="font-medium text-gray-800">
                  {selectedRent.room_name}
                </p>
                <p className="text-gray-500 text-sm mt-1">อสังหาริมทรัพย์</p>
                <p className="text-gray-800">{selectedRent.property_name}</p>
              </div>

              {/* ยอดรวมแบบแถวต่อกัน */}
              <div className="p-4 bg-yellow-50 rounded-xl shadow-md flex justify-between text-center">
                {/* ค่าห้อง */}
                <div className="flex-1">
                  <p className="text-gray-500 text-sm">ค่าห้อง</p>
                  <p className="text-gray-800 font-bold">
                    ฿
                    {selectedRent.room_price.toLocaleString("th-TH", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>

                {/* ค่าน้ำ */}
                <div className="flex-1">
                  <p className="text-gray-500 text-sm">หน่วยน้ำที่ใช้</p>
                  <p className="text-gray-800 font-bold">
                    ฿
                    {selectedRent.water_units.toLocaleString("th-TH", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>

                {/* ค่าไฟ */}
                <div className="flex-1">
                  <p className="text-gray-500 text-sm">หน่วยไฟที่ใช้</p>
                  <p className="text-gray-800 font-bold">
                    ฿
                    {selectedRent.electric_units.toLocaleString("th-TH", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>

                {/* ยอดรวม */}
                <div className="flex-1">
                  <p className="text-gray-500 text-sm">ยอดรวม</p>
                  <p className="text-gray-800 font-bold">
                    ฿
                    {selectedRent.price.toLocaleString("th-TH", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>

              {/* วันที่ */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-xl shadow-md">
                  <p className="text-gray-500 text-sm">วันที่บันทึก</p>
                  <p className="text-gray-800">
                    {formatDate(selectedRent.created_at)}
                  </p>
                </div>
                <div className="p-4 bg-blue-50 rounded-xl shadow-md">
                  <p className="text-gray-500 text-sm">วันที่จ่าย</p>
                  <p className="text-gray-800">
                    {selectedRent.paid_at
                      ? formatDate(selectedRent.paid_at)
                      : "-"}
                  </p>
                </div>
              </div>

              {/* สถานะ */}
              <div className="p-4 bg-purple-50 rounded-xl shadow-md flex items-center justify-between">
                <p className="text-gray-500 text-sm">สถานะ</p>
                <div
                  className={`${getStatusBadge(selectedRent.status).bgColor} ${
                    getStatusBadge(selectedRent.status).textColor
                  } px-3 py-1 rounded-full text-xs font-medium flex items-center`}
                >
                  <i
                    className={`${
                      getStatusBadge(selectedRent.status).icon
                    } mr-1`}
                  ></i>
                  {getStatusBadge(selectedRent.status).text}
                </div>
              </div>

              {/* ปิด modal */}
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setSelectedRent(null)}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-300"
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Confirm Modal */}
      {confirmRentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl shadow-lg max-w-sm w-full p-6 animate-fade-in-up">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              ยืนยันการชำระค่าเช่า
            </h2>
            <p className="text-gray-700 mb-5">
              คุณแน่ใจหรือไม่ว่าต้องการชำระค่าเช่านี้? <br />
              (กรุณาตรวจสอบความเรียบร้อยก่อนกด "ยืนยัน")
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setConfirmRentId(null)}
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => {
                  updateRentStatus(confirmRentId);
                  setConfirmRentId(null);
                }}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
              >
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {modalMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl shadow-lg max-w-sm w-full p-6 animate-fade-in-up">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              แจ้งเตือน
            </h2>
            <p className="text-gray-700 mb-5">{modalMessage}</p>
            <div className="flex justify-end">
              <button
                onClick={() => setModalMessage(null)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-lg shadow-lg text-white font-medium animate-fade-in-right ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {toast.message}
        </div>
      )}
    </Layout>
  );
};

export default Rents;

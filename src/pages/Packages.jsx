// src/pages/Packages.jsx
import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import API from "../api";

const Packages = ({ role }) => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, pending, received
  const [modalMessage, setModalMessage] = useState(null); // ✅ state modal
  const [confirmPackageId, setConfirmPackageId] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setLoading(true);
        const res = await API.get("/packages"); // ดึง packages
        setPackages(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPackages();
  }, []);

  const formatDate = (date) =>
    new Date(date).toLocaleString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const updatePackageStatus = async (id, status) => {
    try {
      await API.put(`/packages/tenant/${id}`, { status });

      setPackages(
        packages.map((pkg) =>
          pkg.id === id
            ? { ...pkg, status, received_at: new Date().toISOString() }
            : pkg
        )
      );

      setModalMessage(
        status === "received" ? "✅ ยืนยันการรับพัสดุสำเร็จ!" : ""
      );
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการอัปเดตสถานะ");
    }
  };

  const filteredPackages = packages.filter((pkg) => {
    if (filter === "all") return true;
    return pkg.status === filter;
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
      {/* Sticky Header with Gradient Background and Filter Tabs */}
      <div className="sticky top-0 z-10 bg-lime-400 text-white shadow-lg pb-4 pt-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-kanit mb-1">
                พัสดุของฉัน
              </h1>
              <p className="text-indigo-100 text-sm">
                จัดการพัสดุที่มาถึงหอพักของคุณ
              </p>
            </div>

            {/* Filter Tabs in Header */}
            <div className="mt-3 sm:mt-0 flex items-center space-x-2">
              <div className="bg-white bg-opacity-20 rounded-lg p-1 flex">
                {[
                  { id: "all", label: "ทั้งหมด" },
                  { id: "pending", label: "ยังไม่ได้รับ" },
                  { id: "received", label: "รับแล้ว" },
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

              <button className="bg-white text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center shadow-md hover:shadow-lg">
                <i className="fas fa-bell mr-2"></i> แจ้งเตือนเมื่อมีพัสดุใหม่
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-lime-50 p-4 md:p-6">
        {/* Loading State */}
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
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center">
                      <div className="h-4 w-4 bg-gray-200 rounded-full mr-3"></div>
                      <div className="h-4 w-full bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : filteredPackages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl shadow-lg">
            <div className="text-indigo-500 mb-4">
              <i className="fas fa-box-open text-5xl"></i>
            </div>
            <h3 className="text-xl font-bold font-kanit mb-2">
              {filter === "all"
                ? "ไม่มีพัสดุในระบบ"
                : `ไม่มีพัสดุ${
                    filter === "pending" ? "ที่ยังไม่ได้รับ" : "ที่รับแล้ว"
                  }`}
            </h3>
            <p className="text-gray-600 mb-6 max-w-md text-center">
              {filter === "all"
                ? "คุณยังไม่มีพัสดุในระบบ พัสดุที่มาถึงจะแสดงที่นี่"
                : filter === "pending"
                ? "คุณได้รับพัสดุทั้งหมดแล้ว"
                : "คุณยังไม่ได้รับพัสดุใดๆ"}
            </p>
            <button className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-full font-medium hover:shadow-lg transition-all duration-300 flex items-center">
              <i className="fas fa-sync-alt mr-2"></i> รีเฟรชข้อมูล
            </button>
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
                  {/* Card Header */}
                  <div className="p-5 bg-gradient-to-r from-indigo-50 to-purple-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-xl font-bold font-kanit text-gray-800">
                          {pkg.name}
                        </h2>
                        <p className="text-gray-600 text-sm flex items-center mt-1">
                          <i className="fas fa-map-marker-alt mr-2 text-indigo-500"></i>
                          {pkg.property_name}
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
                  </div>

                  {/* Card Body */}
                  <div className="p-5">
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <i className="fas fa-info-circle mr-2 text-indigo-500"></i>
                        รายละเอียดพัสดุ
                      </h3>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-gray-700">{pkg.description}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      {/* <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-1">
                          ราคา
                        </h3>
                        <p className="text-lg font-bold text-indigo-600">
                          {pkg.price ? `฿${pkg.price}` : "ไม่ระบุ"}
                        </p>
                      </div> */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <h3 className="text-sm font-medium text-gray-700 mb-1">
                            วันที่บันทึก
                          </h3>
                          <p className="text-sm text-gray-600">
                            {formatDate(pkg.created_at)}
                          </p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-700 mb-1">
                            วันที่รับ
                          </h3>
                          <p className="text-sm text-gray-600">
                            {pkg.received_at
                              ? formatDate(pkg.received_at)
                              : "-"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <i className="fas fa-building mr-2 text-indigo-500"></i>
                        ที่อยู่อสังหาริมทรัพย์
                      </h3>
                      <p className="text-sm text-gray-600">
                        {pkg.property_address}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-between mt-6">
                      <button
                        onClick={() => setSelectedPackage(pkg)}
                        className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center"
                      >
                        <i className="fas fa-info-circle mr-1"></i> ดูรายละเอียด
                      </button>

                      {pkg.status === "pending" && (
                        <button
                          onClick={() => setConfirmPackageId(pkg.id)}
                          className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:shadow-md transition-all duration-300 flex items-center"
                        >
                          <i className="fas fa-check mr-1"></i> ยืนยันการรับ
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {confirmPackageId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl shadow-lg max-w-sm w-full p-6 animate-fade-in-up">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              ยืนยันการรับพัสดุ
            </h2>
            <p className="text-gray-700 mb-5">
              คุณแน่ใจหรือไม่ว่าต้องการยืนยันการรับพัสดุนี้?
              <br /> (ไม่สามารถแก้ไขได้ภายหลัง)
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setConfirmPackageId(null)}
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => {
                  updatePackageStatus(confirmPackageId, "received");
                  setConfirmPackageId(null);
                }}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
              >
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal สำหรับดูรายละเอียด */}
      {selectedPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-gradient-to-br from-purple-400 via-pink-400 to-indigo-400 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scaleIn">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-white/30">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <i className="fas fa-box-open mr-3 text-yellow-300"></i>{" "}
                รายละเอียดพัสดุ
              </h2>
              <button
                onClick={() => setSelectedPackage(null)}
                className="text-white hover:text-yellow-200"
              >
                <i className="fas fa-times text-2xl"></i>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5 bg-white rounded-b-3xl">
              {/* ชื่อพัสดุ */}
              <div className="p-4 bg-indigo-50 rounded-xl shadow-md">
                <p className="text-gray-500 text-sm">ชื่อพัสดุ</p>
                <p className="font-medium text-gray-800">
                  {selectedPackage.name}
                </p>
              </div>

              {/* รายละเอียด */}
              <div className="p-4 bg-pink-50 rounded-xl shadow-md">
                <p className="text-gray-500 text-sm">รายละเอียด</p>
                <p className="text-gray-800">{selectedPackage.description}</p>
              </div>

              {/* ราคา */}
              <div className="p-4 bg-yellow-50 rounded-xl shadow-md">
                <p className="text-gray-500 text-sm">ราคา</p>
                <p className="text-gray-800">
                  {selectedPackage.price ? `฿${selectedPackage.price}` : "-"}
                </p>
              </div>

              {/* วันที่ */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-xl shadow-md">
                  <p className="text-gray-500 text-sm">วันที่บันทึก</p>
                  <p className="text-gray-800">
                    {formatDate(selectedPackage.created_at)}
                  </p>
                </div>
                <div className="p-4 bg-blue-50 rounded-xl shadow-md">
                  <p className="text-gray-500 text-sm">วันที่รับ</p>
                  <p className="text-gray-800">
                    {selectedPackage.received_at
                      ? formatDate(selectedPackage.received_at)
                      : "-"}
                  </p>
                </div>
              </div>

              {/* ที่อยู่ */}
              <div className="p-4 bg-purple-50 rounded-xl shadow-md">
                <p className="text-gray-500 text-sm">ที่อยู่อสังหาริมทรัพย์</p>
                <p className="text-gray-800">
                  {selectedPackage.property_address}
                </p>
              </div>

              {/* ปิด modal */}
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setSelectedPackage(null)}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-300"
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ✅ Modal Overlay */}
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
    </Layout>
  );
};

export default Packages;

// src/pages/Reviews.jsx
import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import API from "../api";

// Modal สำหรับเพิ่ม/แก้ไขรีวิว
const AddEditReviewModal = ({
  isOpen,
  onClose,
  onSubmit,
  formData,
  onInputChange,
  isEdit = false,
  properties,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold font-kanit flex items-center">
            <i
              className={`fas ${
                isEdit ? "fa-edit" : "fa-star"
              } mr-2 text-yellow-500`}
            ></i>
            {isEdit ? "แก้ไขรีวิว" : "รีวิวใหม่"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              อสังหาริมทรัพย์
            </label>
            <select
              name="property_id"
              value={formData.property_id}
              onChange={onInputChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
              required
            >
              <option value="">เลือกอสังหาริมทรัพย์</option>
              {properties.map((p) => (
                <option key={`property-${p.id}`} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ระดับความพึงพอใจ
            </label>
            <select
              name="rating"
              value={formData.rating}
              onChange={onInputChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
              required
            >
              <option value="">เลือกคะแนน</option>
              {[1, 2, 3, 4, 5].map((r) => (
                <option key={r} value={r}>
                  {r} ดาว
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ความคิดเห็น
            </label>
            <textarea
              name="comment"
              value={formData.comment}
              onChange={onInputChange}
              rows="3"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
              placeholder="เขียนความคิดเห็นของคุณ..."
              required
            ></textarea>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="bg-yellow-400 text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg transition-all duration-300 flex items-center"
            >
              <i
                className={`fas ${isEdit ? "fa-save" : "fa-paper-plane"} mr-2`}
              ></i>
              {isEdit ? "บันทึกการแก้ไข" : "ส่งรีวิว"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal สำหรับลบรีวิว
const DeleteModal = ({ isOpen, onClose, onConfirm, itemName }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-6 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <i className="fas fa-exclamation-triangle text-red-600"></i>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            ยืนยันการลบ
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            คุณแน่ใจหรือไม่ที่จะลบรีวิว "{itemName}"?
            การกระทำนี้ไม่สามารถย้อนกลับได้
          </p>
          <div className="flex justify-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              ยกเลิก
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              ลบ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Notification Modal
const NotificationModal = ({ isOpen, onClose, type, title, message }) => {
  if (!isOpen) return null;
  const getIcon = () => {
    switch (type) {
      case "success":
        return "fa-check-circle text-green-500";
      case "error":
        return "fa-times-circle text-red-500";
      default:
        return "fa-info-circle text-blue-500";
    }
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md transform transition-all duration-300 scale-95 animate-scaleIn">
        <div className="p-6 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-4">
            <i className={`fas ${getIcon()} text-2xl`}></i>
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-500 mb-6">{message}</p>
          <div className="flex justify-center">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-yellow-400 text-white rounded-lg hover:bg-yellow-500"
            >
              ตกลง
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// หน้า Reviews
const Reviews = ({ role }) => {
  const [reviews, setReviews] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);

  const [formData, setFormData] = useState({
    id: "",
    property_id: "",
    rating: "",
    comment: "",
  });

  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, setNotificationType] = useState("success");
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const showNotificationModal = (type, title, message) => {
    setNotificationType(type);
    setNotificationTitle(title);
    setNotificationMessage(message);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [reviewsRes, propertiesRes] = await Promise.all([
          API.get("/reviews/tenant"),
          API.get("/properties/reviews/options"),
        ]);
        setReviews(reviewsRes.data);
        setProperties(propertiesRes.data);
      } catch (err) {
        console.error(err);
        showNotificationModal(
          "error",
          "เกิดข้อผิดพลาด",
          "ไม่สามารถโหลดรีวิวได้"
        );
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post("/reviews", formData);
      const res = await API.get("/reviews/tenant");
      setReviews(res.data);
      setShowAddModal(false);
      setFormData({ id: "", property_id: "", rating: "", comment: "" });
      showNotificationModal("success", "สำเร็จ", "เพิ่มรีวิวเรียบร้อยแล้ว");
    } catch (err) {
      console.error(err);
      showNotificationModal(
        "error",
        "เกิดข้อผิดพลาด",
        "ไม่สามารถเพิ่มรีวิวได้"
      );
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/reviews/${formData.id}`, formData);
      const res = await API.get("/reviews/tenant");
      setReviews(res.data);
      setShowEditModal(false);
      setFormData({ id: "", property_id: "", rating: "", comment: "" });
      showNotificationModal("success", "สำเร็จ", "แก้ไขรีวิวเรียบร้อยแล้ว");
    } catch (err) {
      console.error(err);
      showNotificationModal(
        "error",
        "เกิดข้อผิดพลาด",
        "ไม่สามารถแก้ไขรีวิวได้"
      );
    }
  };

  const handleDeleteReview = async () => {
    try {
      await API.delete(`/reviews/${selectedReview.id}`);

      // ดึงข้อมูลรีวิวใหม่จาก server หลังลบ
      const res = await API.get("/reviews/tenant");
      setReviews(res.data);

      setShowDeleteModal(false);
      showNotificationModal("success", "สำเร็จ", "ลบรีวิวเรียบร้อยแล้ว");
    } catch (err) {
      console.error(err);
      showNotificationModal("error", "เกิดข้อผิดพลาด", "ไม่สามารถลบรีวิวได้");
    }
  };

  const openAddModal = () => {
    setFormData({
      id: "",
      property_id: properties[0]?.id || "",
      rating: "",
      comment: "",
    });
    setShowAddModal(true);
  };

  const openEditModal = (review) => {
    setFormData({ ...review });
    setShowEditModal(true);
  };

  const openDeleteModal = (review) => {
    setSelectedReview(review);
    setShowDeleteModal(true);
  };

  return (
    <Layout role={role} showFooter={false} showNav={false}>
      <div className="sticky top-0 z-10 bg-yellow-400 text-white shadow-lg pb-4 pt-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-kanit">
              รีวิวของคุณ
            </h1>
            <p className="text-yellow-100 text-sm">
              จัดการรีวิวอสังหาริมทรัพย์ของคุณ
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="bg-white text-yellow-400 px-4 py-2 rounded-full font-medium flex items-center shadow-md hover:shadow-lg transition-all duration-300"
          >
            <i className="fas fa-plus mr-2"></i> รีวิวใหม่
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-yellow-50 p-4 md:p-6">
        {loading ? (
          <p>กำลังโหลด...</p>
        ) : reviews.length === 0 ? (
          <p>ยังไม่มีรีวิว</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reviews.map((r) => (
              <div
                key={`review-${r.review.id}`}
                className="bg-white rounded-2xl shadow-lg p-5 hover:shadow-xl transition-shadow duration-300"
              >
                {/* Property Header with Icon */}
                <div className="flex items-center mb-3">
                  <div className="mr-3">
                    <i className="fas fa-building text-indigo-500 text-xl"></i>
                  </div>
                  <h2 className="text-lg font-bold font-kanit text-gray-800">
                    {r.property.name}
                  </h2>
                </div>

                {/* User Info with Rating Stars */}
                <div className="flex items-center mb-3">
                  <div className="flex items-center mr-3">
                    <img
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                        r.user_fullname || "คุณ"
                      )}&background=random&color=white`}
                      alt={r.user_fullname || "User"}
                      className="w-8 h-8 rounded-full mr-2"
                    />
                    <span className="font-medium text-gray-700">
                      {r.user_fullname || "คุณ"}
                    </span>
                  </div>

                  <div className="flex items-center ml-auto">
                    <span className="text-yellow-500 font-semibold mr-1">
                      {r.review.rating}
                    </span>
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <i
                          key={i}
                          className={`fas fa-star ${
                            i < Math.floor(r.review.rating)
                              ? "text-yellow-400"
                              : "text-gray-300"
                          }`}
                        ></i>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Comment Content with Quote Icon */}
                <div className="mb-4 relative pl-4 border-l-4 border-indigo-100">
                  <i className="fas fa-quote-left text-indigo-200 absolute left-0 top-2 text-lg"></i>
                  <p className="text-gray-700 leading-relaxed">
                    {r.review.comment}
                  </p>
                </div>

                {/* Timestamp with Calendar Icon */}
                <div className="flex items-center text-sm text-gray-500 mb-3">
                  <i className="far fa-calendar-alt mr-2"></i>
                  <span>สร้างเมื่อ: {formatDate(r.review.created_at)}</span>
                  {r.review.updated_at && (
                    <>
                      <span className="mx-2">|</span>
                      <i className="fas fa-sync-alt mr-2"></i>
                      <span>
                        แก้ไขล่าสุด: {formatDate(r.review.updated_at)}
                      </span>
                    </>
                  )}
                </div>

                {/* Action Buttons with Icons */}
                <div className="flex justify-end space-x-2 mt-2">
                  <button
                    onClick={() =>
                      openEditModal({ ...r.review, property_id: r.property.id })
                    }
                    className="flex items-center px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                  >
                    <i className="fas fa-edit mr-2"></i> แก้ไข
                  </button>
                  <button
                    onClick={() =>
                      openDeleteModal({
                        ...r.review,
                        property_name: r.property.name,
                      })
                    }
                    className="flex items-center px-3 py-1.5 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors duration-200"
                  >
                    <i className="fas fa-trash-alt mr-2"></i> ลบ
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <AddEditReviewModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddSubmit}
        formData={formData}
        onInputChange={handleInputChange}
        properties={properties}
      />

      <AddEditReviewModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleEditSubmit}
        formData={formData}
        onInputChange={handleInputChange}
        isEdit={true}
        properties={properties}
      />

      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteReview}
        itemName={selectedReview?.property_name || ""}
      />

      <NotificationModal
        isOpen={showNotification}
        onClose={() => setShowNotification(false)}
        type={notificationType}
        title={notificationTitle}
        message={notificationMessage}
      />
    </Layout>
  );
};

export default Reviews;

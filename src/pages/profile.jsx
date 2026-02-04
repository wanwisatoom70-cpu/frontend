// File: src/pages/Profile.jsx
import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import API, { isValidEmail, isValidPhone } from "../api";

const Profile = () => {
  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [username, setUsername] = useState("");
  const [Line, setLine] = useState("");
  const [idLine, setIdLine] = useState("");
  const [password, setPassword] = useState("");
  const [profileImage, setProfileImage] = useState(""); // Now supports both File and string URL
  const [activeTab, setActiveTab] = useState("profile");
  const [showPassword, setShowPassword] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [imageInputType, setImageInputType] = useState("file"); // 'file' or 'url'
  const [role, setRole] = useState("");
  const [usernameStatus, setUsernameStatus] = useState(null);
  // null | "checking" | "valid" | "invalid"
  const [usernameMessage, setUsernameMessage] = useState("");

  useEffect(() => {
    if (!isEditing) return;

    if (!username || username.length < 4) {
      setUsernameStatus(null);
      setUsernameMessage("");
      return;
    }

    const userId = localStorage.getItem("userId");

    const delay = setTimeout(async () => {
      try {
        setUsernameStatus("checking");

        const res = await API.get(
          `/users/check-username/${username}?userId=${userId}`,
        );

        if (res.data.valid) {
          setUsernameStatus("valid");
          setUsernameMessage(res.data.message);
        } else {
          setUsernameStatus("invalid");
          setUsernameMessage(res.data.message);
        }
      } catch (err) {
        console.error(err);
        setUsernameStatus("invalid");
        setUsernameMessage("ไม่สามารถตรวจสอบ Username ได้");
      }
    }, 500); // debounce 500ms

    return () => clearTimeout(delay);
  }, [username, isEditing]);

  // ฟังก์ชันโชว์ toast
  const showToast = (text, type = "success") => {
    setToast({ text, type });
    setTimeout(() => {
      setToast(null);
    }, 3000); // 3 วิ
  };
  // Cleanup URL object when component unmounts or profileImage changes
  useEffect(() => {
    return () => {
      if (profileImage instanceof File) {
        URL.revokeObjectURL(profileImage);
      }
    };
  }, [profileImage]);

  useEffect(() => {
    const fetchProfile = async () => {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        showToast("User not logged in", "error");
        setLoading(false);
        return;
      }
      try {
        const res = await API.get(`/users/${userId}`);
        const user = res.data;
        // console.log("User role:", user.role);
        setUsername(user.username || "");
        setFullname(user.fullname || "");
        setEmail(user.email || "");
        setLine(user.line || "");
        setIdLine(user.id_line || "");
        setPhone(user.phone || "");
        setAge(user.age?.toString() || "");
        setProfileImage(user.profile_image || "");
        setRole(user.role || "");
      } catch (err) {
        console.error(err);
        showToast("Failed to fetch profile", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const userId = localStorage.getItem("userId");
    if (!userId) return showToast("User not logged in", "error");

    if (!isValidEmail(email)) {
      return showToast("รูปแบบอีเมลไม่ถูกต้อง", "error");
    }

    if (!isValidPhone(phone)) {
      return showToast("เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก", "error");
    }

    // ตรวจสอบ ID Line สำหรับ tenant
    if (role === "tenant" && !idLine.trim()) {
      return showToast("กรุณากรอก User ID Line", "error");
    }

    try {
      const formData = new FormData();
      formData.append("username", username);
      formData.append("fullname", fullname);
      formData.append("email", email);
      formData.append("line", Line);
      formData.append("id_line", idLine);
      formData.append("phone", phone);
      formData.append("age", age);
      if (password) formData.append("password", password);

      // Handle profile image based on input type
      if (imageInputType === "file" && profileImage instanceof File) {
        formData.append("profile_image", profileImage);
      } else if (imageInputType === "url" && typeof profileImage === "string") {
        formData.append("profile_image_url", profileImage); // Send as separate field
      }

      await API.put(`/users/profile/${userId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      showToast("อัปเดตโปรไฟล์สำเร็จ!", "success");
      // รีเฟรชหน้าหลัง 1 วินาทีเพื่อให้ toast แสดงก่อน
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      showToast("อัปเดตโปรไฟล์ไม่สำเร็จ", "error");
    }
  };

  const toggleEdit = () => {
    setIsEditing(!isEditing);
    if (isEditing) {
      const fetchProfile = async () => {
        const userId = localStorage.getItem("userId");
        if (!userId) return;
        try {
          const res = await API.get(`/users/${userId}`);
          const user = res.data;
          setUsername(user.username || "");
          setFullname(user.fullname || "");
          setEmail(user.email || "");
          setLine(user.line || "");
          setIdLine(user.id_line || "");
          setPhone(user.phone || "");
          setAge(user.age?.toString() || "");
          setProfileImage(user.profile_image || "");
        } catch (err) {
          console.error(err);
        }
      };
      fetchProfile();
    }
  };

  if (loading)
    return (
      <Layout role={role} showFooter={false} showNav={false}>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );

  return (
    <Layout role={role} showFooter={false} showNav={false}>
      {/* Toast Container */}
      {toast && (
        <div className="fixed top-4 right-4 z-50">
          <div
            className={`flex items-center px-4 py-3 rounded-lg shadow-lg text-white ${
              toast.type === "success" ? "bg-green-500" : "bg-red-500"
            }`}
          >
            <i
              className={`fas ${
                toast.type === "success"
                  ? "fa-check-circle"
                  : "fa-exclamation-circle"
              } mr-2`}
            ></i>
            <span>{toast.text}</span>
          </div>
        </div>
      )}

      {/* Sticky Header with Gradient Background */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg pb-4 pt-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-kanit mb-1">
                โปรไฟล์ของฉัน
              </h1>
              <p className="text-indigo-100 text-sm">
                จัดการข้อมูลส่วนตัวของคุณ
              </p>
            </div>
            <button
              onClick={toggleEdit}
              className="mt-3 sm:mt-0 bg-white text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center shadow-md hover:shadow-lg"
            >
              <i
                className={`fas ${isEditing ? "fa-times" : "fa-edit"} mr-2`}
              ></i>
              {isEditing ? "ยกเลิก" : "แก้ไขข้อมูล"}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-gradient-to-br from-indigo-50 to-purple-100 p-4 md:p-6">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden max-w-4xl mx-auto">
          {/* Tabs */}
          <div className="flex border-b">
            {["profile", "security", "settings"].map((tab) => (
              <button
                key={tab}
                className={`px-6 py-4 font-medium text-sm focus:outline-none transition-colors duration-200 ${
                  activeTab === tab
                    ? "text-indigo-600 border-b-2 border-indigo-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === "profile" && "ข้อมูลส่วนตัว"}
                {tab === "security" && "ความปลอดภัย"}
                {tab === "settings" && "ตั้งค่า"}
              </button>
            ))}
          </div>

          {/* Profile Tab Content */}
          {activeTab === "profile" && (
            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-8">
                {/* Left column: Profile Image with Dual Input Options */}
                <div className="flex-shrink-0 flex flex-col items-center">
                  {profileImage ? (
                    <img
                      src={(() => {
                        if (!profileImage) return "/default-avatar.png";

                        if (typeof profileImage === "string") {
                          // กรณีเป็น URL
                          if (
                            profileImage.startsWith("http") ||
                            profileImage.startsWith("https")
                          ) {
                            return profileImage;
                          }
                          // กรณีเป็น path จากฐานข้อมูล
                          if (profileImage.startsWith("/uploads")) {
                            return `http://localhost:5000${profileImage}`; // เปลี่ยนเป็น host ของ backend จริง
                          }
                          // fallback
                          return "/default-avatar.png";
                        }

                        // กรณีเป็น File object
                        if (profileImage instanceof File) {
                          return URL.createObjectURL(profileImage);
                        }

                        return "/default-avatar.png";
                      })()}
                      alt={fullname || username}
                      className="w-32 h-32 rounded-full object-cover border-4 border-indigo-100 shadow-lg"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/default-avatar.png";
                      }}
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center shadow-lg">
                      <i className="fas fa-user text-4xl text-indigo-400"></i>
                    </div>
                  )}

                  <h3 className="mt-4 text-lg font-bold text-center">
                    {fullname}
                  </h3>
                  <p className="text-gray-500 text-sm text-center">
                    @{username}
                  </p>

                  {isEditing && (
                    <div className="mt-4 w-full">
                      <div className="flex border-b mb-4">
                        <button
                          className={`py-2 px-4 font-medium text-sm focus:outline-none transition-colors duration-200 ${
                            imageInputType === "file"
                              ? "text-indigo-600 border-b-2 border-indigo-600"
                              : "text-gray-500"
                          }`}
                          onClick={() => setImageInputType("file")}
                        >
                          อัปโหลดรูป
                        </button>
                        <button
                          className={`py-2 px-4 font-medium text-sm focus:outline-none transition-colors duration-200 ${
                            imageInputType === "url"
                              ? "text-indigo-600 border-b-2 border-indigo-600"
                              : "text-gray-500"
                          }`}
                          onClick={() => setImageInputType("url")}
                        >
                          ใส่ URL
                        </button>
                      </div>

                      {imageInputType === "file" ? (
                        /* File Upload Section */
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            เลือกรูปโปรไฟล์
                          </label>

                          {/* Custom Styled File Input Button */}
                          <div className="relative">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) =>
                                setProfileImage(e.target.files[0])
                              }
                              className="hidden"
                              id="profile-image-upload"
                            />

                            <label
                              htmlFor="profile-image-upload"
                              className="cursor-pointer flex items-center justify-center w-full py-3 px-4 border-2 border-dashed border-indigo-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-200 ease-in-out"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                                  <i className="fas fa-camera text-indigo-500"></i>
                                </div>
                                <span className="text-indigo-600 font-medium">
                                  เลือกไฟล์รูปภาพ
                                </span>
                              </div>
                            </label>

                            {/* Selected File Preview/Info */}
                            {profileImage instanceof File && (
                              <div className="mt-3 p-3 bg-gray-50 rounded-lg flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gray-200 rounded overflow-hidden">
                                  <img
                                    src={URL.createObjectURL(profileImage)}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="text-sm text-gray-600 truncate max-w-xs">
                                  {profileImage.name}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        /* URL Input Section */
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            ใส่ URL รูปภาพโปรไฟล์
                          </label>
                          <input
                            type="text"
                            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            value={
                              typeof profileImage === "string"
                                ? profileImage
                                : ""
                            }
                            onChange={(e) => setProfileImage(e.target.value)}
                            placeholder="https://example.com/image.jpg"
                          />
                          {profileImage && typeof profileImage === "string" && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gray-200 rounded overflow-hidden">
                                <img
                                  src={profileImage}
                                  alt="Preview"
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src =
                                      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB2aWV3Qm94PSIwIDAgMjQgMjQiIHByZXNlcnZlQXNwZWN0UmF0aW89Im5vbmUiPjxsaW5lYXJHcmFkaWVudCBpZD0iZmFkZUdyYWRpZW50IiB4MT0iMCUiIHkxPSIxMDAiIHgyPSIwJSIgeTI9IjEwMCI+PGxpbmVhckdyYWRpZW50IGlkPSJsaW5lUmVhZHkiIHgxPSIwJSIgeTE9IjEwMCIgeDI9IjAlIiB5Mj0iMTAwJSI+PC9saW5lYXJHcmFkaWVudD48bGluZWFyR3JhZGllbnQgaWQ9Imdsb2JhbFBhdGgiIHgxPSIwJSIgeTE9IjEwMCIgeDI9IjAlIiB5Mj0iMTAwJSI+PC9saW5lYXJHcmFkaWVudD48c3ZnIHZlcnRpY2FsLWF4aXMgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMA==";
                                  }}
                                />
                              </div>
                              <div className="text-sm text-gray-600 truncate max-w-xs">
                                {profileImage}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Right column: Form */}
                <div className="flex-1">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          ชื่อผู้ใช้{" "}
                          {isEditing && <span className="text-red-500">*</span>}
                        </label>
                        <input
                          type="text"
                          className={`w-full border rounded-lg px-3 py-2 focus:ring-2
                            ${
                              usernameStatus === "valid"
                                ? "border-green-500 focus:ring-green-500"
                                : usernameStatus === "invalid"
                                  ? "border-red-500 focus:ring-red-500"
                                  : "border-gray-300 focus:ring-indigo-500"
                            }
                            ${isEditing ? "bg-white" : "bg-gray-50"}
                          `}
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          disabled={!isEditing}
                          required
                        />

                        {/* สถานะใต้ช่อง */}
                        {usernameStatus === "checking" && (
                          <p className="text-sm text-gray-500 mt-1">
                            กำลังตรวจสอบ...
                          </p>
                        )}

                        {usernameStatus === "valid" && (
                          <p className="text-sm text-green-600 mt-1">
                            ✔ {usernameMessage}
                          </p>
                        )}

                        {usernameStatus === "invalid" && (
                          <p className="text-sm text-red-600 mt-1">
                            ✖ {usernameMessage}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          ชื่อ-นามสกุล{" "}
                          {isEditing && <span className="text-red-500">*</span>}
                        </label>
                        <input
                          type="text"
                          className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                            isEditing
                              ? "bg-white border-gray-300"
                              : "bg-gray-50 border-gray-200"
                          }`}
                          value={fullname}
                          onChange={(e) => setFullname(e.target.value)}
                          required
                          disabled={!isEditing}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          อีเมล{" "}
                          {isEditing && <span className="text-red-500">*</span>}
                        </label>
                        <input
                          type="email"
                          className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                            isEditing
                              ? "bg-white border-gray-300"
                              : "bg-gray-50 border-gray-200"
                          }`}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          disabled={!isEditing}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          เบอร์โทรศัพท์{" "}
                          {isEditing && <span className="text-red-500">*</span>}
                        </label>
                        <input
                          type="text"
                          className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                            isEditing
                              ? "bg-white border-gray-300"
                              : "bg-gray-50 border-gray-200"
                          }`}
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required
                          disabled={!isEditing}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          ID Line{" "}
                          {isEditing && <span className="text-red-500">*</span>}
                        </label>
                        <input
                          type="text"
                          className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                            isEditing
                              ? "bg-white border-gray-300"
                              : "bg-gray-50 border-gray-200"
                          }`}
                          value={Line}
                          onChange={(e) => setLine(e.target.value)}
                          required
                          disabled={!isEditing}
                        />
                      </div>
                      {/* <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          อายุ {isEditing && <span className="text-red-500">*</span>}
                        </label>
                        <input
                          type="number"
                          className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                            isEditing
                              ? "bg-white border-gray-300"
                              : "bg-gray-50 border-gray-200"
                          }`}
                          value={age}
                          onChange={(e) => setAge(e.target.value)}
                          required
                          disabled={!isEditing}
                        />
                      </div> */}
                      {role === "tenant" && (
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            User ID Line{" "}
                            {isEditing && (
                              <span className="text-red-500">*</span>
                            )}
                          </label>
                          <input
                            type="text"
                            className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                              isEditing
                                ? "bg-white border-gray-300"
                                : "bg-gray-50 border-gray-200"
                            }`}
                            value={idLine}
                            onChange={(e) => setIdLine(e.target.value)}
                            disabled={!isEditing}
                          />
                        </div>
                      )}
                    </div>

                    {isEditing && (
                      <div className="pt-4">
                        <button
                          type="submit"
                          className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-lg font-medium hover:shadow-lg transition-all duration-300 flex items-center justify-center
                 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={
                            // tenant ต้องมี Line ID
                            (role === "tenant" && !idLine.trim()) ||
                            // username ยังไม่ผ่าน
                            usernameStatus === "invalid" ||
                            // username กำลังตรวจสอบ
                            usernameStatus === "checking"
                          }
                        >
                          <i className="fas fa-save mr-2"></i> บันทึกข้อมูล
                        </button>
                      </div>
                    )}
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab Content */}
          {activeTab === "security" && (
            <div className="p-6">
              <div className="max-w-md mx-auto">
                <h2 className="text-xl font-bold font-kanit mb-6">
                  เปลี่ยนรหัสผ่าน
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      รหัสผ่านใหม่
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="ป้อนรหัสผ่านใหม่ อย่างน้อย 6 ตัวอักษร"
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
                        />
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      เว้นว่างถ้าไม่ต้องการเปลี่ยนรหัสผ่าน
                    </p>
                  </div>

                  <div>
                    <button
                      type="submit"
                      className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-lg font-medium hover:shadow-lg transition-all duration-300 flex items-center justify-center"
                      disabled={
                        !password ||
                        password.length < 6 ||
                        password.includes(" ")
                      }
                    >
                      <i className="fas fa-lock mr-2"></i> อัปเดตรหัสผ่าน
                    </button>
                  </div>
                </form>

                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-medium mb-4">
                    การตั้งค่าความปลอดภัยเพิ่มเติม
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">การยืนยันตัวตนสองขั้นตอน</p>
                        <p className="text-sm text-gray-500">
                          เพิ่มความปลอดภัยให้บัญชีของคุณ
                        </p>
                      </div>
                      <button className="text-indigo-600 hover:text-indigo-800 font-medium text-sm">
                        เปิดใช้งาน
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">อุปกรณ์ที่เข้าสู่ระบบ</p>
                        <p className="text-sm text-gray-500">
                          จัดการอุปกรณ์ที่ใช้งานบัญชีนี้
                        </p>
                      </div>
                      <button className="text-indigo-600 hover:text-indigo-800 font-medium text-sm">
                        จัดการ
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab Content */}
          {activeTab === "settings" && (
            <div className="p-6">
              <h2 className="text-xl font-bold font-kanit mb-6">
                ตั้งค่าการแจ้งเตือน
              </h2>
              <div className="space-y-4 max-w-md">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">อีเมลแจ้งเตือน</p>
                    <p className="text-sm text-gray-500">
                      รับการแจ้งเตือนผ่านอีเมล
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      defaultChecked
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">การแจ้งเตือนพัสดุ</p>
                    <p className="text-sm text-gray-500">
                      แจ้งเตือนเมื่อมีพัสดุใหม่
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      defaultChecked
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">การแจ้งเตือนการชำระเงิน</p>
                    <p className="text-sm text-gray-500">
                      แจ้งเตือนก่อนครบกำหนดชำระเงิน
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      defaultChecked
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">ข่าวสารและโปรโมชั่น</p>
                    <p className="text-sm text-gray-500">
                      รับข่าวสารและโปรโมชั่นจากเรา
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium mb-4">ภาษา</h3>
                <div className="flex space-x-4">
                  <button className="px-4 py-2 bg-indigo-500 text-white rounded-lg font-medium">
                    ไทย
                  </button>
                  <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg font-medium hover:bg-gray-50">
                    English
                  </button>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium mb-4 text-red-600">
                  การจัดการบัญชี
                </h3>
                <div className="space-y-3">
                  <button className="w-full text-left p-3 bg-red-50 rounded-lg text-red-600 font-medium hover:bg-red-100 transition-colors duration-200">
                    ลบบัญชีผู้ใช้
                  </button>
                  <button className="w-full text-left p-3 bg-gray-50 rounded-lg text-gray-600 font-medium hover:bg-gray-100 transition-colors duration-200">
                    ออกจากระบบทั้งหมด
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Profile;

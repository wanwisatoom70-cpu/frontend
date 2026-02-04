// File: src/pages/Login.jsx
import React, { useState } from "react";
import Layout from "../components/Layout";
import { useNavigate, Link } from "react-router-dom";
import API from "../api";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await API.post("/auth/login", { username, password });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);
      localStorage.setItem("userId", res.data.userId);
      localStorage.setItem("fullname", res.data.fullname);
      localStorage.setItem("username", res.data.username);
      localStorage.setItem("profile_image", res.data.profile_image || "");

      // Navigate ตาม role
      switch (res.data.role) {
        case "admin":
          navigate("/admin");
          break;
        case "owner":
          navigate("/owner");
          break;
        case "staff":
          navigate("/staff");
          break;
        case "tenant":
          navigate("/tenant");
          break;
        case "guest":
          navigate("/home");
          break;
        default:
          navigate("/");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout role="visitor" showNav={false}>
      <div
        className="relative flex items-center justify-center h-screen bg-cover bg-center"
        style={{
          backgroundImage: "url('../../image/pexels-dada-_design-240566386-12277126.jpg')",
        }}
      >

        {/* Content แบ่งซ้าย-ขวา */}
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between max-w-6xl w-full px-6 md:px-10">
          {/* ฝั่งซ้าย: ข้อความ */}
          <div className="md:w-1/2 text-left mb-10 md:mb-0">
            <h1 className="text-4xl font-bold font-kanit gradient-text mb-4">
              เข้าสู่ระบบ
            </h1>
            <p className="text-gray-600 leading-relaxed max-w-md">
              กรุณากรอกข้อมูลผู้ใช้และรหัสผ่านของคุณเพื่อเข้าสู่ระบบ
              หลังจากเข้าสู่ระบบสำเร็จ คุณจะสามารถจัดการข้อมูลส่วนตัว
              ตรวจสอบสถานะการเช่า และเข้าถึงฟีเจอร์ต่างๆ ของระบบจัดการหอพักได้
              โปรดตรวจสอบความถูกต้องของข้อมูลก่อนกดเข้าสู่ระบบ
            </p>
          </div>

          {/* ฝั่งขวา: ฟอร์มล็อกอิน */}
          <div className="md:w-1/2 bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
            {error && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <i className="fas fa-exclamation-circle text-red-500"></i>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* ฟอร์มเข้าสู่ระบบ */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  ชื่อผู้ใช้
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="fas fa-user text-gray-400"></i>
                  </div>
                  <input
                    id="username"
                    type="text"
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  รหัสผ่าน
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="fas fa-lock text-gray-400"></i>
                  </div>
                  <input
                    id="password"
                    type="password"
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center text-sm text-gray-700">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded mr-2"
                  />
                  จดจำฉัน
                </label>
                <a
                  href="#"
                  className="text-sm font-medium text-primary hover:text-accent"
                >
                  ลืมรหัสผ่าน?
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary to-accent text-white py-3 px-4 rounded-lg font-medium hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
              </button>
            </form>

            {/* สมัครสมาชิก
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                ยังไม่มีบัญชี?{" "}
                <Link
                  to="/register"
                  className="font-medium text-primary hover:text-accent"
                >
                  สมัครสมาชิก
                </Link>
              </p>
            </div> */}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Login;

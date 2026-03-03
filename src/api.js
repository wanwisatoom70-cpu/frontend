// src/api.js
import axios from "axios";

const API = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
});

// ใช้ตัวแปร global หรือ window เพื่อเก็บ callback
let onUnauthorized = null;

// ให้ React ตั้ง callback นี้ได้
export const setUnauthorizedHandler = (callback) => {
  onUnauthorized = callback;
};

// --- Request Interceptor ---
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

// --- Response Interceptor ---
API.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      if (onUnauthorized && !window.__sessionExpiredShown) {
        window.__sessionExpiredShown = true;
        onUnauthorized(); // แค่เรียก callback ให้ React แสดง modal
      }
      // ❌ ไม่ return redirect หรือ reject อัตโนมัติ
    }
    return Promise.reject(error);
  }
);

/**
 * ตรวจสอบ email format
 * @param {string} email
 * @returns {boolean} true = ถูกต้อง, false = ไม่ถูกต้อง
 */
export const isValidEmail = (email) => {
  if (!email) return false;
  // ตรวจสอบว่ามี @ และรูปแบบพื้นฐาน
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

/**
 * ตรวจสอบเบอร์โทรศัพท์
 * @param {string} phone
 * @returns {boolean} true = ถูกต้อง, false = ไม่ถูกต้อง
 */
export const isValidPhone = (phone) => {
  if (!phone) return false;
  // ตรวจสอบว่าเป็นตัวเลข 10 ตัว
  const re = /^\d{10}$/;
  return re.test(phone);
};
export default API;

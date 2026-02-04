// File: src/pages/Home.jsx
import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import PropertyCard from "../components/PropertyCard";
import API from "../api";

const Home = () => {
  const [properties, setProperties] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        const res = await API.get("/properties");
        setProperties(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, []);

  const filtered = properties.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout role="guest" showFooter={false} showNav={false}>
      <div className="flex flex-col py-2">
        <div className="mb-1 text-center">
          <div className="relative inline-block mb-4">
            {/* Decorative background shape */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-2xl transform rotate-3 opacity-20 blur-sm"></div>
            {/* Image container with styling */}
            <div className="relative bg-white p-1 rounded-2xl shadow-lg">
              <img
                src="/upload/12.jpg"
                alt="logo"
                className="w-58 h-32 object-cover rounded-xl"
              />
              {/* Decorative elements */}
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full opacity-70"></div>
              <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-pink-400 rounded-full opacity-70"></div>
            </div>
          </div>
          <p className="max-w-2xl mx-auto text-sm leading-relaxed">
            <span className="gradient-text">ค้นหาหอพักที่ตรงกับความต้องการของคุณจากหอพักมากมายที่เราได้รวบรวมไว้ให้คุณ</span>
          </p>
        </div>

        {/* Sticky Search Bar */}
        <div className="sticky top-0 z-10 bg-white/10 backdrop-blur-sm py-4 mb-2 shadow-sm">
          <div className="relative max-w-2xl mx-auto">
            <input
              type="text"
              placeholder="ค้นหาชื่อหอพักหรือที่อยู่..."
              className="w-full p-4 pl-12 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-lg"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
              <i className="fas fa-search text-xl"></i>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {filtered.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4 text-gray-300">
                    <i className="fas fa-search"></i>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    ไม่พบหอพักที่คุณค้นหา
                  </h3>
                  <p className="text-gray-500">
                    ลองค้นหาด้วยคำอื่นหรือตรวจสอบการสะกดคำ
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered.map((prop) => (
                    <PropertyCard key={prop.id} property={prop} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Home;
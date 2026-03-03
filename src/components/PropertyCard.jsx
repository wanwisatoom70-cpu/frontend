// File: src/components/PropertyCard.jsx
import React from "react";
import { Link } from "react-router-dom";

const PropertyCard = ({ property }) => {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="relative h-40 overflow-hidden">
        <img
          src={
            property.image
              ? `${import.meta.env.VITE_API_IMG}${property.image}`
              : "/default-dorm.jpg"
          }
          alt={property.name}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
        />

        {/* <div className="absolute top-3 right-3 bg-white bg-opacity-90 rounded-full p-1.5 shadow-md">
          <i className="fas fa-heart text-gray-400 hover:text-red-500 transition-colors duration-300 text-sm"></i>
        </div> */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
          <h2 className="text-white font-bold text-lg truncate">
            {property.name}
          </h2>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center text-gray-600 mb-2">
          <i className="fas fa-map-marker-alt mr-2 text-primary text-sm"></i>
          <span className="text-xs truncate">{property.address}</span>
        </div>

        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center">
            <i className="fas fa-door-open mr-1.5 text-gray-500 text-sm"></i>
            <span className="text-xs text-gray-600">
              ว่าง {property.available_rooms || 0}/{property.total_rooms}
            </span>
          </div>
          <div className="flex items-center">
            <i className="fas fa-star text-yellow-400 mr-1 text-xs"></i>
            <span className="text-xs font-semibold">
              {property.rating || "ไม่มีรีวิว"}
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div>
            <div className="text-sm font-bold text-primary">
              ฿
              {property.min_price_monthly
                ? property.min_price_monthly.toLocaleString()
                : "-"}
              /฿
              {property.min_price_term
                ? property.min_price_term.toLocaleString()
                : "-"}
            </div>

            <div className="text-xs text-gray-500">เดือน/เทอม</div>
          </div>
          <Link
            to="/property/detail"
            state={{ propertyId: property.id }}
            className="bg-gradient-to-r from-primary to-accent text-white px-3 py-1.5 rounded-full text-xs font-medium hover:shadow-md transition-all duration-300"
          >
            ดูรายละเอียด
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;

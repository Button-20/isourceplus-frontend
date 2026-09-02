import React from "react";
import { FaUsers, FaBuilding, FaGlobe } from "react-icons/fa";

const Clients_no = () => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-center bg-background p-8 rounded-lg shadow-lg space-y-6 md:space-y-0 font-montserrat">
      {/* Buyers and Suppliers */}
      <div className="text-center flex-1">
        <FaUsers className="text-blue-600 text-5xl mx-auto mb-2" />
        <h1 className="text-3xl md:text-2xl font-medium text-blue-600">
          Over 10,000
        </h1>
        <small className="text-muted-foreground text-sm md:text-base">
          buyers and suppliers
        </small>
      </div>

      {/* Registered Companies */}
      <div className="text-center flex-1">
        <FaBuilding className="text-green-600 text-5xl mx-auto mb-2" />
        <h1 className="text-3xl md:text-2xl font-medium text-green-600">
          Over 500
        </h1>
        <small className="text-muted-foreground text-sm md:text-base">
          registered companies
        </small>
      </div>

      {/* Global Reach */}
      <div className="text-center flex-1">
        <FaGlobe className="text-purple-600 text-5xl mx-auto mb-2" />
        <h1 className="text-3xl md:text-2xl font-medium text-purple-600">
          Global Reach
        </h1>
        <small className="text-muted-foreground text-sm md:text-base">
          International procurement enabled
        </small>
      </div>
    </div>
  );
};

export default Clients_no;

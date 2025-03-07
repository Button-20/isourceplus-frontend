import React from "react";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";

const PricingCard = ({
  title,
  price,
  features,
  isPopular = false,
  isSelected = false,
}) => {
  return (
    <div
      className={`relative rounded-lg p-6 shadow-lg transition-transform transform hover:scale-105 font-montserrat ${
        isSelected
          ? " bg-indigo-600 text-white"
          : "bg-white border border-gray-200"
      }`}
    >
      {isPopular && (
        <div className="absolute -top-3 -right-3 bg-yellow-300 text-black font-bold text-xs py-1 px-3 rounded-full">
          Popular
        </div>
      )}
      <h2
        className={`text-2xl font-medium mb-4 ${
          isSelected ? "text-white" : "text-gray-800"
        }`}
      >
        {title}
      </h2>
      <p className="text-4xl font-medium mb-4">
        GHC {price}
        <span className="text-lg font-medium">
          <br /> /month
        </span>
      </p>
      <ul className="mb-6 space-y-3">
        {features.map((feature, index) => (
          <li
            key={index}
            className={`flex items-center ${
              feature.included ? "text-green-950" : "text-red-500"
            } ${isPopular && "text-white"}`}
          >
            {feature.included ? (
              <FaCheckCircle className="h-6 w-6 mr-3" />
            ) : (
              <FaTimesCircle className="h-6 w-6 mr-3" />
            )}
            {feature.text}
          </li>
        ))}
      </ul>
      <button
        className={`w-full py-3 rounded-lg font-bold text-lg ${
          isSelected
            ? "bg-white text-indigo-600 hover:bg-indigo-100"
            : "bg-indigo-600 text-white hover:bg-indigo-700"
        } transition duration-300`}
      >
        {isSelected ? "Selected" : "Choose Plan"}
      </button>
    </div>
  );
};

export default PricingCard;

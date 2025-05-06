import React, { useState } from "react";
import { FaBuilding, FaTruck, FaChevronRight } from "react-icons/fa";
import { useNavigate } from "react-router";

const CompanyChoices = () => {
  const [selectedChoice, setSelectedChoice] = useState(null);

  const navigate = useNavigate();

  const handleChoiceSelect = (choice) => {
    setSelectedChoice(choice);
  };

  const handleNext = () => {
    if (selectedChoice) {
      console.log(`Selected: ${selectedChoice}`);
      
      if (!selectedChoice) return
      
      if(selectedChoice === "company") {
        navigate("/onboarding/company");
      } else if (selectedChoice === "transport") {
        navigate("/onboarding/transporter");
      }
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 flex-grow">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choose Your Account Type</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Select between a standard company account or a transport company
            account to get started with iSourcePlus.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Company Card */}
          <div
            className={`border-2 rounded-xl p-8 transition-all duration-300 cursor-pointer ${
              selectedChoice === "company"
                ? "border-black bg-gray-50 shadow-lg"
                : "border-gray-200 hover:border-gray-400"
            }`}
            onClick={() => handleChoiceSelect("company")}
          >
            <div className="flex justify-center mb-6">
              <div
                className={`p-4 rounded-full ${
                  selectedChoice === "company"
                    ? "bg-black text-white"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                <FaBuilding className="text-3xl" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-center mb-4">Company</h2>
            <p className="text-gray-600 mb-6 text-center">
              Ideal for businesses looking to manage their supply chain,
              inventory, and procurement processes.
            </p>
            <ul className="space-y-2 mb-8">
              <li className="flex items-center">
                <span
                  className={`rounded-full p-1 mr-2 ${
                    selectedChoice === "company"
                      ? "bg-black text-white"
                      : "bg-gray-200 text-gray-800"
                  }`}
                >
                  ✓
                </span>
                <span>Inventory management</span>
              </li>
              <li className="flex items-center">
                <span
                  className={`rounded-full p-1 mr-2 ${
                    selectedChoice === "company"
                      ? "bg-black text-white"
                      : "bg-gray-200 text-gray-800"
                  }`}
                >
                  ✓
                </span>
                <span>Supplier network</span>
              </li>
              <li className="flex items-center">
                <span
                  className={`rounded-full p-1 mr-2 ${
                    selectedChoice === "company"
                      ? "bg-black text-white"
                      : "bg-gray-200 text-gray-800"
                  }`}
                >
                  ✓
                </span>
                <span>Analytics dashboard</span>
              </li>
            </ul>
          </div>

          {/* Transport Company Card */}
          <div
            className={`border-2 rounded-xl p-8 transition-all duration-300 cursor-pointer ${
              selectedChoice === "transport"
                ? "border-black bg-gray-50 shadow-lg"
                : "border-gray-200 hover:border-gray-400"
            }`}
            onClick={() => handleChoiceSelect("transport")}
          >
            <div className="flex justify-center mb-6">
              <div
                className={`p-4 rounded-full ${
                  selectedChoice === "transport"
                    ? "bg-black text-white"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                <FaTruck className="text-3xl" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-center mb-4">
              Transport Company
            </h2>
            <p className="text-gray-600 mb-6 text-center">
              Designed for logistics providers offering transportation services
              within the supply chain network.
            </p>
            <ul className="space-y-2 mb-8">
              <li className="flex items-center">
                <span
                  className={`rounded-full p-1 mr-2 ${
                    selectedChoice === "transport"
                      ? "bg-black text-white"
                      : "bg-gray-200 text-gray-800"
                  }`}
                >
                  ✓
                </span>
                <span>Fleet management</span>
              </li>
              <li className="flex items-center">
                <span
                  className={`rounded-full p-1 mr-2 ${
                    selectedChoice === "transport"
                      ? "bg-black text-white"
                      : "bg-gray-200 text-gray-800"
                  }`}
                >
                  ✓
                </span>
                <span>Route optimization</span>
              </li>
              <li className="flex items-center">
                <span
                  className={`rounded-full p-1 mr-2 ${
                    selectedChoice === "transport"
                      ? "bg-black text-white"
                      : "bg-gray-200 text-gray-800"
                  }`}
                >
                  ✓
                </span>
                <span>Load matching</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Next Button */}
        <div className="mt-12 flex justify-center">
          <button
            onClick={handleNext}
            disabled={!selectedChoice}
            className={`flex items-center px-6 py-3 rounded-md font-medium transition-colors ${
              selectedChoice
                ? "bg-black text-white hover:bg-gray-800"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            Continue <FaChevronRight className="ml-2" />
          </button>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="bg-black text-white p-6 text-center">
        <p>© 2025 iSourcePlus. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default CompanyChoices;

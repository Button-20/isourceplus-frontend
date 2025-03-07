import React, { useState } from "react";
import { Plus, Edit, Trash, X, Menu } from "lucide-react";

const sellerServices = [
  {
    id: 1,
    name: "House Cleaning",
    category: "Home",
    description:
      "Keep your home spotless by connecting with trusted cleaning pros in your area.",
    features: [
      "Regular Scheduling",
      "Eco-Friendly Supplies",
      "Trusted Professionals",
      "Clear Pricing",
      "Easy Booking",
    ],
    image:
      "https://images.unsplash.com/photo-1541123437800-1bb1317badc2?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.0.3",
  },
  {
    id: 2,
    name: "Handyman On-Demand",
    category: "Home",
    description:
      "Get quick fixes and repairs by connecting with skilled handymen near you.",
    features: [
      "Fast Repairs",
      "Experienced Experts",
      "Affordable Rates",
      "Local Service",
      "Transparent Quotes",
    ],
    image:
      "https://plus.unsplash.com/premium_photo-1682597001129-42e04d67253f?w=400&auto=format&fit=crop&q=60",
  },
  {
    id: 3,
    name: "Grocery Delivery",
    category: "Delivery",
    description:
      "Order fresh groceries online and have them delivered right to your doorstep.",
    features: [
      "Fresh Produce",
      "Local Stores",
      "Simple Ordering",
      "Fast Delivery",
      "Reliable Service",
    ],
    image:
      "https://plus.unsplash.com/premium_photo-1682144120790-1461fd602bc9?w=400&auto=format&fit=crop&q=60",
  },
  {
    id: 4,
    name: "Event Planning",
    category: "Events",
    description:
      "Make every occasion memorable by connecting with local event planners who bring your vision to life.",
    features: [
      "Creative Ideas",
      "Full-Service Planning",
      "Budget-Friendly",
      "Vendor Coordination",
      "Personalized Touch",
    ],
    image:
      "https://images.unsplash.com/photo-1542345812-d98b5cd6cf98?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
  },
];

const categories = ["All", "Home", "Delivery", "Events"];

const Store = () => {
  const [services, setServices] = useState(sellerServices);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Filter services based on search term and selected category (case-insensitive)
  const filteredServices = services.filter((service) => {
    const matchesSearch = service.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || service.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleEdit = (id) => {
    // Implement editing logic here (e.g., open a modal or navigate to edit page)
    console.log(`Edit service with id: ${id}`);
  };

  const handleDelete = (id) => {
    // Implement delete logic here (e.g., confirmation modal)
    console.log(`Delete service with id: ${id}`);
    setServices((prev) => prev.filter((service) => service.id !== id));
  };

  const handleAddService = () => {
    // Implement redirection to a new service form or modal
    console.log("Redirect to add new service page or open modal");
  };

  // Sidebar content: filtering controls
  const SidebarContent = () => (
    <div className="p-4 space-y-4">
      {/* Search */}
      <input
        type="text"
        placeholder="Search services..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600"
      />
      {/* Categories */}
      <div className="space-y-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`w-full px-4 py-2 border rounded-lg transition-colors whitespace-nowrap ${
              selectedCategory === category
                ? "bg-black text-white border-indigo-600"
                : "bg-white text-gray-600 border-gray-300"
            }`}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-gray-100 min-h-screen font-montserrat">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-8">
          <h1 className="text-4xl font-medium mb-4 md:mb-0">My Store</h1>
          <div className="flex justify-between w-full md:w-auto">
            {/* On mobile, show a button to open the sidebar */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden  p-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button
              onClick={handleAddService}
              className=" p-3 bg-black text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex">
          {/* Sidebar for md and up */}
          <div className="hidden md:block md:w-1/4 bg-white rounded-lg shadow-lg mr-8">
            <SidebarContent />
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {filteredServices.length === 0 ? (
              <p className="text-center text-gray-600">No services found.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredServices.map((service) => (
                  <div
                    key={service.id}
                    className="bg-white rounded-lg shadow-lg overflow-hidden transition-transform hover:scale-105"
                  >
                    <img
                      src={service.image}
                      alt={service.name}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-6">
                      <h3 className="text-xl font-medium mb-2">
                        {service.name}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {service.description}
                      </p>
                      <ul className="space-y-2 mb-6">
                        {service.features.map((feature, index) => (
                          <li key={index} className="flex items-center">
                            <svg
                              className="w-4 h-4 text-green-500 mr-2"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <div className="flex gap-4">
                        <button
                          onClick={() => handleEdit(service.id)}
                          className="flex-1 flex items-center justify-center p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(service.id)}
                          className="flex-1 flex items-center justify-center p-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Sidebar (overlay) */}
        {sidebarOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-gray-800 bg-opacity-50"
              onClick={() => setSidebarOpen(false)}
            ></div>
            <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-xl font-medium">Filters</h2>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <SidebarContent />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Store;

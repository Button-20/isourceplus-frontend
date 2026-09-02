import React, { useState } from "react";

const services = [
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
      "https://images.unsplash.com/photo-1541123437800-1bb1317badc2?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
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
      "https://plus.unsplash.com/premium_photo-1682597001129-42e04d67253f?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTN8fGhhbmR5bWFufGVufDB8fDB8fHww",
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
      "https://plus.unsplash.com/premium_photo-1682144120790-1461fd602bc9?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8Z3JvY2VyeSUyMGRlbGl2ZXJ5fGVufDB8fDB8fHww",
  },
  {
    id: 4,
    name: "Food Catering",
    category: "Catering",
    description:
      "Plan your next event by connecting with local catering services for delicious menus.",
    features: [
      "Custom Menus",
      "Expert Chefs",
      "Event Packages",
      "Flexible Options",
      "Quality Ingredients",
    ],
    image:
      "https://images.unsplash.com/photo-1551218808-94e220e084d2?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
  },
  {
    id: 5,
    name: "Freelance Tutoring",
    category: "Education",
    description:
      "Boost your learning by connecting with experienced tutors in various subjects.",
    features: [
      "Personalized Sessions",
      "Flexible Timing",
      "Expert Guidance",
      "Online/In-Person Options",
      "Affordable Rates",
    ],
    image:
      "https://images.unsplash.com/photo-1529070538774-1843cb3265df?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
  },
  {
    id: 6,
    name: "Car Repair & Maintenance",
    category: "Automotive",
    description:
      "Keep your vehicle running smoothly by connecting with reliable auto mechanics.",
    features: [
      "Skilled Technicians",
      "Clear Estimates",
      "Quality Parts",
      "Prompt Service",
      "Customer Support",
    ],
    image:
      "https://plus.unsplash.com/premium_photo-1675810094948-d4634e766d2b?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8Q2FyJTIwUmVwYWlyJTIwJTI2JTIwTWFpbnRlbmFuY2V8ZW58MHx8MHx8fDA%3D",
  },
  {
    id: 7,
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
  {
    id: 8,
    name: "Personal Fitness Training",
    category: "Fitness",
    description:
      "Reach your fitness goals by connecting with certified trainers for one-on-one sessions.",
    features: [
      "Customized Workouts",
      "Flexible Schedules",
      "Motivational Coaching",
      "Progress Tracking",
      "Local & Online Options",
    ],
    image:
      "https://plus.unsplash.com/premium_photo-1661284998331-56c7d22c0dc3?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8UGVyc29uYWwlMjBGaXRuZXNzJTIwVHJhaW5lcnxlbnwwfHwwfHx8MA%3D%3D",
  },
];

const categories = [
  "All",
  "Home",
  "Delivery",
  "Catering",
  "Education",
  "Automotive",
  "Events",
  "Fitness",
];

const Marketplace = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showFilters, setShowFilters] = useState(false);

  // Filter services based on search term and selected category (case-insensitive)
  const filteredServices = services.filter((service) => {
    const matchesSearch = service.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || service.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-background py-16 font-montserrat">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-medium text-center mb-4">
          Connecting Buyers & Suppliers Seamlessly
        </h1>
        <p className="text-center text-muted-foreground mb-12">
          Efficient sourcing, tenders, and transactions for everyday services.
        </p>

        {/* Toggle Button for Filters */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setShowFilters((prev) => !prev)}
            className="px-4 py-2 bg-brand text-white rounded-lg hover:opacity-90 transition-colors"
          >
            {showFilters ? "Hide Filters" : "Filter"}
          </button>
        </div>

        {/* Conditionally Render Filters */}
        {showFilters && (
          <div className="mb-8">
            {/* Responsive Category Filter */}
            <div className="mb-4 overflow-x-auto scrollbar-hide">
              <div className="flex flex-nowrap justify-center gap-4">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 border rounded-lg transition-colors whitespace-nowrap ${
                      selectedCategory === category
                        ? "bg-brand text-white border-brand"
                        : "bg-card text-muted-foreground border-border"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Filter */}
            <div className="flex justify-center">
              <input
                type="text"
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-1/2 p-3 border border-border rounded-lg focus:outline-hidden focus:border-brand"
              />
            </div>
          </div>
        )}

        {/* Service Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className="bg-card rounded-lg shadow-lg overflow-hidden transition-transform hover:scale-105"
            >
              <img
                src={service.image}
                alt={service.name}
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h3 className="text-xl font-medium mb-2">{service.name}</h3>
                <p className="text-muted-foreground mb-4">{service.description}</p>
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
                <button className="w-full bg-brand text-white py-2 px-4 rounded-lg hover:opacity-90 transition-colors">
                  Learn More
                </button>
              </div>
            </div>
          ))}
          {filteredServices.length === 0 && (
            <p className="col-span-full text-center text-muted-foreground">
              No services found.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Marketplace;

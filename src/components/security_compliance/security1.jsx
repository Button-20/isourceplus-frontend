import { motion } from "framer-motion";
import { features, security } from "@/assets/assets";
import React from "react";
import { SlideLeft, SlideRight } from "@/utility/animation";

const Features = () => {
  // Fallback in case security or its properties are not available
  const fallbackData = [
    {
      title: "Default Title",
      description: "Default content.",
      icon: "Default content.",
    },
  ];

  const data = features?.length ? features : fallbackData;

  return (
    <section className="py-12 font-montserrat">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {data.map((item, index) => (
            <motion.div
              key={index}
              variants={index % 2 === 0 ? SlideRight(0.2) : SlideLeft(0.4)}
              initial="hidden"
              whileInView="visible"
              className="flex flex-col items-center text-center bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <img
                src={item.icon}
                alt="Descriptive alt text"
                className="w-20 h-20 mb-4 object-cover  border-2 border-indigo-600 rounded-full"
              />
              <h1 className="text-2xl font-medium text-indigo-700 mb-4">
                {item.title}
              </h1>
              <p className="text-gray-700 text-base leading-relaxed">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;

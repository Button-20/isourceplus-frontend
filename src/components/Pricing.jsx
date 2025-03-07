import { pricingData } from "@/assets/assets";
import React from "react";
import PricingCard from "./PricingCard";

const Pricing = () => {
  return (
    <div className="container mx-auto px-6 py-12 font-montserrat">
      <h1 className="text-4xl font-medium text-gray-800 text-center mb-12">
        Organization Subscription Plan
      </h1>
      <div className="grid grid-cols-1  md:grid-cols-2 lg:grid-cols-4 gap-8">
        {pricingData.map((plan, index) => (
          <PricingCard key={index} {...plan} />
        ))}
      </div>
    </div>

  );
};

export default Pricing;

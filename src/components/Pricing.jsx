import React from "react";
import { Link } from "react-router-dom";

const Pricing = () => {
  return (
    <div className="container mx-auto px-6 py-12 font-montserrat">
      <h1 className="text-4xl font-medium text-foreground text-center mb-12">
        Organization Subscription Plan
      </h1>
      <div className="text-center">
        <p className="text-lg text-muted-foreground mb-6">
          Discover our flexible subscription plans tailored for Buyers and Suppliers. Click below to explore all pricing options and find the perfect plan for your business.
        </p>
        <Link
          to="/pricing"
          className="inline-block bg-brand-gradient text-white py-3 px-6 rounded-md font-medium hover:opacity-90 transition-colors"
        >
          Go to Pricing Page
        </Link>
      </div>
    </div>
  );
};

export default Pricing;
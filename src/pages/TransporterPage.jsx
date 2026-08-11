// pages/NewTransporterPage.jsx
import React from "react";
import TransporterForm from "@/components/TransporterForm";
import { Truck } from "lucide-react";

export default function TransporterPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-9xl mx-auto">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center mb-4">
            <Truck className="w-8 h-8 text-black mr-2" />
            <h1 className="text-3xl font-bold text-gray-900">Transporter Registration</h1>
          </div>
          <p className="text-lg text-gray-600">
            Register your transportation services to join our network
          </p>
        </div>
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="bg-black text-white px-6 py-4 flex items-center">
            <Truck className="w-5 h-5 mr-2" />
            <h2 className="text-xl font-bold">Transport Service Details</h2>
          </div>
          <TransporterForm />
        </div>
      </div>
    </div>
  );
}
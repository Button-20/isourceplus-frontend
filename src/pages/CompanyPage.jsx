// pages/NewCompanyPage.jsx
import React from "react";
import CompanyForm from "@/components/CompanyForm";
import { Building2 } from "lucide-react";

export default function CompanyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-9xl mx-auto">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center mb-4">
            <Building2 className="w-8 h-8 text-black mr-2" />
            <h1 className="text-3xl font-bold text-gray-900">Company Registration</h1>
          </div>
          <p className="text-lg text-gray-600">
            Register your company to join our network
          </p>
        </div>
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="bg-black text-white px-6 py-4 flex items-center">
            <Building2 className="w-5 h-5 mr-2" />
            <h2 className="text-xl font-bold">Company Details</h2>
          </div>
          <CompanyForm />
        </div>
      </div>
    </div>
  );
}
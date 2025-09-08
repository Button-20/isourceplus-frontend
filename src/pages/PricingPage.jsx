import { useState } from "react";
import { Check, MessageSquare, Users, Building } from "lucide-react";
import { Link } from "react-router-dom";
import ScrollToTop from "@/components/ScrollToTop";

const buyerPlans = [
  {
    name: "Bronze",
    monthlyRate: 14,
    sixMonthRate: 134.4,
    twelveMonthRate: 117.6,
    defaultUsers: 1,
    addOnFee: 10,
    smsBonus: 5,
    competitiveOffers: "1X",
    suppliersMarketBase: 356,
    registeredBuyers: 100,
    transactionalSMS: 50,
    promoSMS: 15,
  },
  {
    name: "Silver",
    monthlyRate: 21,
    sixMonthRate: 201.6,
    twelveMonthRate: 141.12,
    defaultUsers: 2,
    addOnFee: 10,
    smsBonus: 10,
    competitiveOffers: "2X",
    suppliersMarketBase: 629,
    registeredBuyers: 208,
    transactionalSMS: 60,
    promoSMS: 20,
  },
  {
    name: "Gold",
    monthlyRate: 28,
    sixMonthRate: 268.8,
    twelveMonthRate: 188.16,
    defaultUsers: 3,
    addOnFee: 10,
    smsBonus: 15,
    competitiveOffers: "3X",
    suppliersMarketBase: 1005,
    registeredBuyers: 504,
    transactionalSMS: 70,
    promoSMS: 30,
  },
  {
    name: "Diamond",
    monthlyRate: 42,
    sixMonthRate: 403.2,
    twelveMonthRate: 282.24,
    defaultUsers: 3,
    addOnFee: 10,
    smsBonus: 20,
    competitiveOffers: "4X",
    suppliersMarketBase: 1139,
    registeredBuyers: 708,
    transactionalSMS: 100,
    promoSMS: 40,
  },
  {
    name: "Platinum",
    monthlyRate: 56,
    sixMonthRate: 537.6,
    twelveMonthRate: 376.32,
    defaultUsers: 4,
    addOnFee: 10,
    smsBonus: 25,
    competitiveOffers: "5X",
    suppliersMarketBase: 1515,
    registeredBuyers: 987,
    transactionalSMS: 110,
    promoSMS: 50,
  },
];

const supplierPlans = [
  {
    name: "Bronze",
    monthlyRate: 21,
    sixMonthRate: 201.6,
    twelveMonthRate: 176.4,
    defaultUsers: 1,
    addOnFee: 10,
    smsBonus: 5,
    businessOpportunities: "1X",
    buyersMarketBase: 100,
    registeredSuppliers: 356,
    transactionalSMS: 50,
    promoSMS: 15,
  },
  {
    name: "Silver",
    monthlyRate: 28,
    sixMonthRate: 268.8,
    twelveMonthRate: 235.2,
    defaultUsers: 2,
    addOnFee: 10,
    smsBonus: 10,
    businessOpportunities: "2X",
    buyersMarketBase: 308,
    registeredSuppliers: 273,
    transactionalSMS: 60,
    promoSMS: 20,
  },
  {
    name: "Gold",
    monthlyRate: 35,
    sixMonthRate: 336,
    twelveMonthRate: 294,
    defaultUsers: 3,
    addOnFee: 10,
    smsBonus: 15,
    businessOpportunities: "3X",
    buyersMarketBase: 812,
    registeredSuppliers: 376,
    transactionalSMS: 70,
    promoSMS: 30,
  },
  {
    name: "Diamond",
    monthlyRate: 49,
    sixMonthRate: 470.4,
    twelveMonthRate: 411.6,
    defaultUsers: 3,
    addOnFee: 10,
    smsBonus: 20,
    businessOpportunities: "4X",
    buyersMarketBase: 1520,
    registeredSuppliers: 134,
    transactionalSMS: 100,
    promoSMS: 40,
  },
  {
    name: "Platinum",
    monthlyRate: 70,
    sixMonthRate: 672,
    twelveMonthRate: 588,
    defaultUsers: 4,
    addOnFee: 10,
    smsBonus: 25,
    businessOpportunities: "5X",
    buyersMarketBase: 2507,
    registeredSuppliers: 376,
    transactionalSMS: 110,
    promoSMS: 50,
  },
];

const commonFeatures = [
  { name: "Managing User Permissions", included: true },
  { name: "SMS Recharge/Top-up", included: true },
  { name: "Reports", included: true },
  { name: "Two-Way Authentication", included: true },
  { name: "12-Month Support", included: true },
];

export function PricingPage() {
  const [activeTab, setActiveTab] = useState("buyer");
  const [showComparison, setShowComparison] = useState(false);

  const plans = activeTab === "buyer" ? buyerPlans : supplierPlans;
  const marketAccessKey = activeTab === "buyer" ? "suppliersMarketBase" : "buyersMarketBase";
  const marketAccessLabel = activeTab === "buyer" ? "Suppliers’ Market Base" : "Buyers’ Market Base";
  const opportunityLabel = activeTab === "buyer" ? "Competitive Offers" : "Business Opportunities";
  const registeredLabel = activeTab === "buyer" ? "Registered Buyers" : "Registered Suppliers";

  return (
    <div className="min-h-screen bg-gray-100">
      <ScrollToTop />
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="mb-4">
            <Link to="/" className="text-sm text-gray-600 hover:underline">
              &larr; Back to Home
            </Link>
          </div>
          <h1 className="text-4xl font-bold mb-4">iSourcePlus Pricing</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Choose the perfect plan for your business needs. All prices include VAT.
          </p>
          <div className="flex justify-center space-x-4 mt-4">
            <button
              className={`px-6 py-2 rounded-md font-medium ${activeTab === "buyer" ? "bg-black text-white" : "bg-gray-200 text-gray-700"}`}
              onClick={() => setActiveTab("buyer")}
            >
              Buyer Plans
            </button>
            <button
              className={`px-6 py-2 rounded-md font-medium ${activeTab === "supplier" ? "bg-black text-white" : "bg-gray-200 text-gray-700"}`}
              onClick={() => setActiveTab("supplier")}
            >
              Supplier Plans
            </button>
          </div>
        </div>

        {/* Card-Based Layout */}
        <div className="grid md:grid-cols-3 lg:grid-cols-3 gap-6 mb-12">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:border-black transition-all duration-300"
            >
              <h2 className="text-2xl font-bold text-center mb-4">{plan.name}</h2>
              <div className="text-center mb-4">
                <p className="text-3xl font-semibold">Ghc {plan.monthlyRate}/mo</p>
                <p className="text-sm text-gray-600">6-Month: Ghc {plan.sixMonthRate} (20% off)</p>
                <p className="text-sm text-gray-600">12-Month: Ghc {plan.twelveMonthRate} (30% off)</p>
                <p className="text-sm text-gray-500">VAT Included</p>
              </div>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-2" />
                  <span>{plan.defaultUsers} Default User{plan.defaultUsers > 1 ? "s" : ""}</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-2" />
                  <span>Ghc {plan.addOnFee}/user/mo Add-On</span>
                </li>
                <li className="flex items-center">
                  <MessageSquare className="w-5 h-5 text-green-500 mr-2" />
                  <span>{plan.transactionalSMS} Transactional SMS</span>
                </li>
                <li className="flex items-center">
                  <MessageSquare className="w-5 h-5 text-green-500 mr-2" />
                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-sm">
                    {plan.promoSMS} Promo SMS (Oct-Dec 2025) to invite your suppliers
                  </span>
                </li>
                <li className="flex items-center">
                  <Building className="w-5 h-5 text-green-500 mr-2" />
                  <span>
                    {activeTab === "buyer" ? plan.competitiveOffers : plan.businessOpportunities} {opportunityLabel}
                  </span>
                </li>
                <li className="flex items-center">
                  <Users className="w-5 h-5 text-green-500 mr-2" />
                  <span>{plan[marketAccessKey]} {marketAccessLabel}</span>
                </li>
                <li className="flex items-center">
                  <Users className="w-5 h-5 text-green-500 mr-2" />
                  <span>{activeTab === "buyer" ? plan.registeredBuyers : plan.registeredSuppliers} {registeredLabel}</span>
                </li>
                {commonFeatures.map((feature) => (
                  <li key={feature.name} className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-2" />
                    <span>{feature.name}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/signup"
                className="block w-full text-center bg-black text-white py-2 rounded-md hover:bg-gray-800"
              >
                Select Plan
              </Link>
            </div>
          ))}
        </div>

        {/* Compare Plans Button */}
        <div className="text-center mb-12">
          <button
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            onClick={() => {setShowComparison(!showComparison)
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            }}
          >
            {showComparison ? "Hide Comparison" : "Compare Plans"}
          </button>
        </div>

        {/* Comparison Table */}
        {showComparison && (
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 mb-12">
            <h2 className="text-2xl font-bold text-center mb-6">
              {activeTab === "buyer" ? "Buyer Plans Comparison" : "Supplier Plans Comparison"}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-3 border-b">Feature</th>
                    {plans.map((plan) => (
                      <th key={plan.name} className="p-3 border-b text-center">{plan.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-3 border-b">Monthly Rate (GHC)</td>
                    {plans.map((plan) => (
                      <td key={plan.name} className="p-3 border-b text-center">{plan.monthlyRate}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 border-b">6-Month Rate (GHC, 20% off)</td>
                    {plans.map((plan) => (
                      <td key={plan.name} className="p-3 border-b text-center">{plan.sixMonthRate}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 border-b">12-Month Rate (GHC, 30% off)</td>
                    {plans.map((plan) => (
                      <td key={plan.name} className="p-3 border-b text-center">{plan.twelveMonthRate}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 border-b">Default Users</td>
                    {plans.map((plan) => (
                      <td key={plan.name} className="p-3 border-b text-center">{plan.defaultUsers}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 border-b">Add-On Fee (GHC/user/mo)</td>
                    {plans.map((plan) => (
                      <td key={plan.name} className="p-3 border-b text-center">{plan.addOnFee}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 border-b">Purchase SMS Bonus (GHC)</td>
                    {plans.map((plan) => (
                      <td key={plan.name} className="p-3 border-b text-center">{plan.smsBonus}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 border-b">{opportunityLabel}</td>
                    {plans.map((plan) => (
                      <td key={plan.name} className="p-3 border-b text-center">
                        {activeTab === "buyer" ? plan.competitiveOffers : plan.businessOpportunities}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 border-b">{marketAccessLabel}</td>
                    {plans.map((plan) => (
                      <td key={plan.name} className="p-3 border-b text-center">{plan[marketAccessKey]}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 border-b">{registeredLabel}</td>
                    {plans.map((plan) => (
                      <td key={plan.name} className="p-3 border-b text-center">
                        {activeTab === "buyer" ? plan.registeredBuyers : plan.registeredSuppliers}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 border-b">Transactional SMS</td>
                    {plans.map((plan) => (
                      <td key={plan.name} className="p-3 border-b text-center">{plan.transactionalSMS}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 border-b">Promo SMS (Oct-Dec 2025)</td>
                    {plans.map((plan) => (
                      <td key={plan.name} className="p-3 border-b text-center">
                        {plan.promoSMS} (to invite your suppliers)
                      </td>
                    ))}
                  </tr>
                  {commonFeatures.map((feature) => (
                    <tr key={feature.name}>
                      <td className="p-3 border-b">{feature.name}</td>
                      {plans.map((plan) => (
                        <td key={plan.name} className="p-3 border-b text-center">
                          <Check className="w-5 h-5 text-green-500 mx-auto" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
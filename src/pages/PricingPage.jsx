// PricingPage.jsx
import { useEffect, useState } from "react";
import { Check, MessageSquare, Users, Building, Truck, AlertCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import ScrollToTop from "@/components/ScrollToTop";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { getCookie } from "@/utility/getCookie";

// NO CHANGES: Plan data (buyerPlans, supplierPlans, transporterPlans, commonFeatures)
const buyerPlans = [
  {
    name: "Bronze",
    monthlyRate: 14,
    sixMonthRate: 134.4,
    twelveMonthRate: 117.6,
    defaultUsers: 1,
    addOnFee: 10,
    branchAddOn: 10,
    smsBonus: 5,
    competitiveOffers: "1X",
    suppliersMarketBase: 356,
    registeredBuyers: 100,
    registeredTransporters: 100,
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
    branchAddOn: 10,
    smsBonus: 10,
    competitiveOffers: "2X",
    suppliersMarketBase: 629,
    registeredBuyers: 208,
    registeredTransporters: 308,
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
    branchAddOn: 10,
    smsBonus: 15,
    competitiveOffers: "3X",
    suppliersMarketBase: 1005,
    registeredBuyers: 504,
    registeredTransporters: 812,
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
    branchAddOn: 10,
    smsBonus: 20,
    competitiveOffers: "4X",
    suppliersMarketBase: 1139,
    registeredBuyers: 708,
    registeredTransporters: 1520,
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
    branchAddOn: 10,
    smsBonus: 25,
    competitiveOffers: "5X",
    suppliersMarketBase: 1515,
    registeredBuyers: 987,
    registeredTransporters: 2507,
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
    branchAddOn: 10,
    smsBonus: 5,
    businessOpportunities: "1X",
    buyersMarketBase: 100,
    registeredSuppliers: 356,
    registeredTransporters: 100,
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
    branchAddOn: 10,
    smsBonus: 10,
    businessOpportunities: "2X",
    buyersMarketBase: 308,
    registeredSuppliers: 273,
    registeredTransporters: 308,
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
    branchAddOn: 10,
    smsBonus: 15,
    businessOpportunities: "3X",
    buyersMarketBase: 812,
    registeredSuppliers: 376,
    registeredTransporters: 812,
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
    branchAddOn: 10,
    smsBonus: 20,
    businessOpportunities: "4X",
    buyersMarketBase: 1520,
    registeredSuppliers: 134,
    registeredTransporters: 1520,
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
    branchAddOn: 10,
    smsBonus: 25,
    businessOpportunities: "5X",
    buyersMarketBase: 2507,
    registeredSuppliers: 376,
    registeredTransporters: 2507,
    transactionalSMS: 110,
    promoSMS: 50,
  },
];

const transporterPlans = [
  {
    name: "Bronze",
    monthlyRate: 20,
    sixMonthRate: 102,
    twelveMonthRate: 180,
    defaultUsers: 1,
    addOnFee: 10,
    branchAddOn: 10,
    smsBonus: 0,
    businessOpportunities: "1X",
    buyersMarketBase: 100,
    registeredSuppliers: 356,
    registeredTransporters: 100,
    transactionalSMS: 50,
    promoSMS: 15,
  },
  {
    name: "Silver",
    monthlyRate: 25,
    sixMonthRate: 127.5,
    twelveMonthRate: 225,
    defaultUsers: 2,
    addOnFee: 10,
    branchAddOn: 10,
    smsBonus: 0,
    businessOpportunities: "2X",
    buyersMarketBase: 308,
    registeredSuppliers: 273,
    registeredTransporters: 308,
    transactionalSMS: 60,
    promoSMS: 20,
  },
  {
    name: "Gold",
    monthlyRate: 30,
    sixMonthRate: 153,
    twelveMonthRate: 270,
    defaultUsers: 3,
    addOnFee: 10,
    branchAddOn: 10,
    smsBonus: 0,
    businessOpportunities: "3X",
    buyersMarketBase: 812,
    registeredSuppliers: 376,
    registeredTransporters: 812,
    transactionalSMS: 70,
    promoSMS: 30,
  },
  {
    name: "Diamond",
    monthlyRate: 35,
    sixMonthRate: 178.5,
    twelveMonthRate: 315,
    defaultUsers: 3,
    addOnFee: 10,
    branchAddOn: 10,
    smsBonus: 0,
    businessOpportunities: "4X",
    buyersMarketBase: 1520,
    registeredSuppliers: 134,
    registeredTransporters: 1520,
    transactionalSMS: 100,
    promoSMS: 40,
  },
  {
    name: "Platinum",
    monthlyRate: 40,
    sixMonthRate: 204,
    twelveMonthRate: 360,
    defaultUsers: 4,
    addOnFee: 10,
    branchAddOn: 10,
    smsBonus: 0,
    businessOpportunities: "5X",
    buyersMarketBase: 2507,
    registeredSuppliers: 376,
    registeredTransporters: 2507,
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
  const [selectedPlans, setSelectedPlans] = useState(
    buyerPlans.reduce((acc, plan) => ({ ...acc, [plan.name]: "biannually" }), {})
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isTrial, setIsTrial] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { authAxios, user, companyId, transporterId, jobTitle, token, userProfileId, fetchProfileInfo } = useAuth();

  const plans = activeTab === "buyer" ? buyerPlans : activeTab === "supplier" ? supplierPlans : transporterPlans;
  const marketAccessKey = activeTab === "buyer" ? "suppliersMarketBase" : "buyersMarketBase";
  const marketAccessLabel = activeTab === "buyer" ? "Suppliers’ Market Base" : "Buyers’ Market Base";
  const opportunityLabel = activeTab === "buyer" ? "Competitive Offers" : "Business Opportunities";
  const registeredLabel = activeTab === "buyer" ? "Registered Buyers" : activeTab === "supplier" ? "Registered Suppliers" : "Registered Transporters";

  useEffect(() => {
    if (user && token && userProfileId) {
      fetchProfileInfo();
    }
  }, [authAxios, userProfileId, user, token]);

  const handlePlanSelection = (planName, value) => {
    setSelectedPlans((prev) => ({ ...prev, [planName]: value })); // FIXED: Changed acc to prev
  };

  const canSubscribe = () => {
    if (!user) return false;
    const allowedTitles = activeTab === "transporter" ? ["logistics manager"] : ["lead buyer", "sales manager"];
    console.log("User Job Title:", jobTitle);
    return allowedTitles.includes(jobTitle?.toLowerCase());
  };

  const initiateSubscription = async (plan, isTrialMode) => {
    if (!user) {
      toast.error("Please log in to subscribe.", { icon: <AlertCircle className="w-5 h-5" /> });
      navigate("/login");
      return;
    }

    if (!canSubscribe()) {
      toast.error("Only Lead Buyer, Sales Manager, or Logistics Manager can subscribe.", {
        icon: <AlertCircle className="w-5 h-5" />,
      });
      return;
    }

    if ((activeTab === "buyer" || activeTab === "supplier") && !companyId) {
      toast.error("Please complete company onboarding to subscribe.", {
        icon: <AlertCircle className="w-5 h-5" />,
      });
      navigate("/dashboard/company/edit");
      return;
    }

    if (activeTab === "transporter" && !transporterId) {
      toast.error("Please complete transporter onboarding to subscribe.", {
        icon: <AlertCircle className="w-5 h-5" />,
      });
      navigate("/dashboard/transporter/edit");
      return;
    }

    setSelectedPlan(plan);
    setIsTrial(isTrialMode);
    setIsModalOpen(true);
  };

  const confirmSubscription = async () => {
    setIsLoading(true);
    try {
      const planInterval = selectedPlans[selectedPlan.name];
      const backendPlanInterval = planInterval === "biannually" ? "biannually" : planInterval === "annually" ? "annually" : "monthly";
      const amountKey = planInterval === "biannually" ? "sixMonthRate" : planInterval === "annually" ? "twelveMonthRate" : "monthlyRate";
      const startDate = isTrial ? new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] : null;

      // UPDATED: Use plan name in uppercase as plan_name
      const planName = selectedPlan.name.toUpperCase(); // e.g., BRONZE

      const csrfToken = getCookie("csrftoken");
      if (!csrfToken) {
        console.error("CSRF token is missing");
        toast.error("CSRF token is missing. Please refresh the page and try again.", {
          icon: <AlertCircle className="w-5 h-5" />,
        });
        setIsLoading(false);
        return;
      }

      console.log("cookie", csrfToken);
      console.log("Sending params:", {
        plan_name: planName,
        plan_interval: backendPlanInterval,
        ...(isTrial && { is_trial: true, start_date: startDate }),
      });

      const response = await authAxios.post(
        "/subscriptions/subscribe/",
        {},
        {
          params: {
            plan_name: planName, // UPDATED: Send planName (e.g., BRONZE)
            plan_interval: backendPlanInterval,
            ...(isTrial && { is_trial: true, start_date: startDate }),
          },
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
          }
        }
      );

      const { authorization_url, reference } = response.data.transaction_data;

      localStorage.setItem(
        "subscriptionData",
        JSON.stringify({
          plan_code: `${activeTab.toUpperCase()}_${planName}_${backendPlanInterval.toUpperCase()}`, // e.g., BUYER_BRONZE_BIANNUALLY
          plan_name: planName, // UPDATED: Store planName (e.g., BRONZE)
          plan_interval: backendPlanInterval,
          is_trial: isTrial,
          start_date: startDate,
          reference,
          authorization_url,
        })
      );

      window.open(authorization_url, "_blank");
      setIsModalOpen(false);
    } catch (error) {
      console.error("Subscription initiation error:", error);
      console.error("Error details:", {
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers,
      });
      if (error.response?.status === 404) {
        toast.error("User not authenticated or company details missing.", {
          icon: <AlertCircle className="w-5 h-5" />,
        });
        navigate("/login");
      } else if (error.response?.status === 402) {
        toast.error("Abandoned transaction found.", {
          icon: <AlertCircle className="w-5 h-5" />,
          action: {
            label: "Continue Transaction",
            onClick: () => window.open(error.response.data.authorization_url, "_blank"),
          },
        });
      } else if (error.response?.status === 403) {
        toast.error(
          error.response?.data?.detail || "You do not have permission to perform this action. Please check your account or contact support.",
          {
            icon: <AlertCircle className="w-5 h-5" />,
          }
        );
      } else {
        toast.error(
          error.response?.data?.detail ||
            error.response?.data?.name?.[0] ||
            "Failed to initiate subscription. Please try again or contact support.",
          {
            icon: <AlertCircle className="w-5 h-5" />,
          }
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

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
            Choose the perfect plan for your business needs. All prices exclude VAT.
          </p>
          <div className="flex justify-center space-x-4 mt-4">
            <button
              className={`px-6 py-2 rounded-md font-medium ${activeTab === "buyer" ? "bg-black text-white" : "bg-gray-200 text-gray-700"}`}
              onClick={() => {
                setActiveTab("buyer");
                setSelectedPlans(buyerPlans.reduce((acc, plan) => ({ ...acc, [plan.name]: "biannually" }), {}));
              }}
            >
              Buyer Plans
            </button>
            <button
              className={`px-6 py-2 rounded-md font-medium ${activeTab === "supplier" ? "bg-black text-white" : "bg-gray-200 text-gray-700"}`}
              onClick={() => {
                setActiveTab("supplier");
                setSelectedPlans(supplierPlans.reduce((acc, plan) => ({ ...acc, [plan.name]: "biannually" }), {}));
              }}
            >
              Supplier Plans
            </button>
            <button
              className={`px-6 py-2 rounded-md font-medium ${activeTab === "transporter" ? "bg-black text-white" : "bg-gray-200 text-gray-700"}`}
              onClick={() => {
                setActiveTab("transporter");
                setSelectedPlans(transporterPlans.reduce((acc, plan) => ({ ...acc, [plan.name]: "biannually" }), {}));
              }}
            >
              Transporter Plans
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 lg:grid-cols-3 gap-6 mb-12">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:border-black transition-all duration-300"
            >
              <h2 className="text-2xl font-bold text-center mb-4">{plan.name}</h2>
              <div className="text-center mb-4">
                <p className="text-3xl font-semibold">Ghc {plan.monthlyRate}/mo</p>
                <div className="mt-2">
                  <label className="inline-flex items-center mr-4">
                    <input
                      type="radio"
                      name={`${plan.name}-duration`}
                      value="biannually"
                      checked={selectedPlans[plan.name] === "biannually"}
                      onChange={() => handlePlanSelection(plan.name, "biannually")}
                      className="form-radio text-black focus:ring-black"
                    />
                    <span className="ml-2 text-sm text-gray-600">
                      6-Month (Biannually): Ghc {plan.sixMonthRate} ({activeTab === "transporter" ? "15% off" : "20% off"})
                    </span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name={`${plan.name}-duration`}
                      value="annually"
                      checked={selectedPlans[plan.name] === "annually"}
                      onChange={() => handlePlanSelection(plan.name, "annually")}
                      className="form-radio text-black focus:ring-black"
                    />
                    <span className="ml-2 text-sm text-gray-600">
                      12-Month (Annually): Ghc {plan.twelveMonthRate} ({activeTab === "transporter" ? "25% off" : "30% off"})
                    </span>
                  </label>
                </div>
                <p className="text-sm text-gray-500">VAT Excluded</p>
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
                  <Check className="w-5 h-5 text-green-500 mr-2" />
                  <span>Ghc {plan.branchAddOn}/branch/mo Add-On</span>
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
                  {activeTab === "transporter" ? (
                    <Truck className="w-5 h-5 text-green-500 mr-2" />
                  ) : (
                    <Users className="w-5 h-5 text-green-500 mr-2" />
                  )}
                  <span>
                    {activeTab === "buyer" ? plan.registeredBuyers : activeTab === "supplier" ? plan.registeredSuppliers : plan.registeredTransporters} {registeredLabel}
                  </span>
                </li>
                {activeTab === "buyer" && (
                  <li className="flex items-center">
                    <Truck className="w-5 h-5 text-green-500 mr-2" />
                    <span>{plan.registeredTransporters} Registered Transporters</span>
                  </li>
                )}
                {activeTab === "supplier" && (
                  <li className="flex items-center">
                    <Truck className="w-5 h-5 text-green-500 mr-2" />
                    <span>{plan.registeredTransporters} Registered Transporters</span>
                  </li>
                )}
                {activeTab === "transporter" && (
                  <li className="flex items-center">
                    <Users className="w-5 h-5 text-green-500 mr-2" />
                    <span>{plan.registeredSuppliers} Registered Suppliers</span>
                  </li>
                )}
                {commonFeatures.map((feature) => (
                  <li key={feature.name} className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-2" />
                    <span>{feature.name}</span>
                  </li>
                ))}
              </ul>
              <div className="flex space-x-4">
                {user ? (
                  <>
                    <button
                      onClick={() => initiateSubscription(plan, true)}
                      className="flex-1 text-center bg-gray-200 text-gray-700 py-2 rounded-md hover:bg-gray-300"
                      disabled={isLoading}
                    >
                      {isLoading ? "Processing..." : "Start Trial"}
                    </button>
                    <button
                      onClick={() => initiateSubscription(plan, false)}
                      className="flex-1 text-center bg-black text-white py-2 rounded-md hover:bg-gray-800"
                      disabled={isLoading}
                    >
                      {isLoading ? "Processing..." : "Subscribe"}
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to={`/signup?trial=true&plan=${plan.name.toLowerCase()}&duration=${selectedPlans[plan.name]}&type=${activeTab}`}
                      className="flex-1 text-center bg-gray-200 text-gray-700 py-2 rounded-md hover:bg-gray-300"
                    >
                      Start Trial
                    </Link>
                    <Link
                      to={`/signup?plan=${plan.name.toLowerCase()}&duration=${selectedPlans[plan.name]}&type=${activeTab}`}
                      className="flex-1 text-center bg-black text-white py-2 rounded-md hover:bg-gray-800"
                    >
                      Subscribe
                    </Link>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mb-12">
          <button
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            onClick={() => {
              setShowComparison(!showComparison);
              if (!showComparison) {
                window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
              }
            }}
          >
            {showComparison ? "Hide Comparison" : "Compare Plans"}
          </button>
        </div>

        {showComparison && (
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 mb-12">
            <h2 className="text-2xl font-bold text-center mb-6">
              {activeTab === "buyer" ? "Buyer Plans Comparison" : activeTab === "supplier" ? "Supplier Plans Comparison" : "Transporter Plans Comparison"}
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
                    <td className="p-3 border-b">6-Month Rate (GHC, {activeTab === "transporter" ? "15% off" : "20% off"})</td>
                    {plans.map((plan) => (
                      <td key={plan.name} className="p-3 border-b text-center">{plan.sixMonthRate}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 border-b">12-Month Rate (GHC, {activeTab === "transporter" ? "25% off" : "30% off"})</td>
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
                    <td className="p-3 border-b">Branch Add-On (GHC/branch/mo)</td>
                    {plans.map((plan) => (
                      <td key={plan.name} className="p-3 border-b text-center">{plan.branchAddOn}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 border-b">Purchase SMS Bonus (GHC)</td>
                    {plans.map((plan) => (
                      <td key={plan.name} className="p-3 border-b text-center">{plan.smsBonus || "0"}</td>
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
                        {activeTab === "buyer" ? plan.registeredBuyers : activeTab === "supplier" ? plan.registeredSuppliers : plan.registeredTransporters}
                      </td>
                    ))}
                  </tr>
                  {activeTab === "buyer" && (
                    <tr>
                      <td className="p-3 border-b">Registered Transporters</td>
                      {plans.map((plan) => (
                        <td key={plan.name} className="p-3 border-b text-center">{plan.registeredTransporters}</td>
                      ))}
                    </tr>
                  )}
                  {activeTab === "supplier" && (
                    <tr>
                      <td className="p-3 border-b">Registered Transporters</td>
                      {plans.map((plan) => (
                        <td key={plan.name} className="p-3 border-b text-center">{plan.registeredTransporters}</td>
                      ))}
                    </tr>
                  )}
                  {activeTab === "transporter" && (
                    <tr>
                      <td className="p-3 border-b">Registered Suppliers</td>
                      {plans.map((plan) => (
                        <td key={plan.name} className="p-3 border-b text-center">{plan.registeredSuppliers}</td>
                      ))}
                    </tr>
                  )}
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

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm {isTrial ? "Trial" : "Subscription"}</DialogTitle>
            </DialogHeader>
            {selectedPlan && (
              <div className="space-y-4">
                <p>
                  <strong>Plan:</strong> {selectedPlan.name} ({activeTab})
                </p>
                <p>
                  <strong>Duration:</strong>{" "}
                  {selectedPlans[selectedPlan.name] === "biannually"
                    ? "6 Months (Biannually)"
                    : selectedPlans[selectedPlan.name] === "annually"
                    ? "12 Months (Annually)"
                    : "Monthly"}
                </p>
                <p>
                  <strong>Cost:</strong> Ghc{" "}
                  {selectedPlans[selectedPlan.name] === "biannually"
                    ? selectedPlan.sixMonthRate
                    : selectedPlans[selectedPlan.name] === "annually"
                    ? selectedPlan.twelveMonthRate
                    : selectedPlan.monthlyRate}
                  {selectedPlans[selectedPlan.name] === "monthly" ? "/mo" : ""}
                </p>
                {isTrial && (
                  <p>
                    <strong>Trial Period:</strong> 28 days (ends on{" "}
                    {new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toLocaleDateString()})
                  </p>
                )}
                <p>You will be redirected to Paystack to complete the {isTrial ? "trial" : "subscription"}.</p>
              </div>
            )}
            <DialogFooter>
              <button
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                onClick={() => setIsModalOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
                onClick={confirmSubscription}
                disabled={isLoading}
              >
                {isLoading ? "Processing..." : "Confirm"}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
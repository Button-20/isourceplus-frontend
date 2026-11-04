// Single source of truth for subscription pricing, shared by the /pricing page
// and the landing-page pricing teaser so the two never drift apart.
// Prices are per billing period in GHS, VAT excluded (subscription card,
// 2026-11-04): quarterly, biannually (10% off two quarters) and annually (15%
// off four quarters). The keys match the API's plan_interval values.

// Billing periods, in the order they're offered. Trials are quarterly only.
export const PLAN_INTERVALS = [
  { value: "quarterly", label: "Quarterly", short: "quarter", discount: null },
  {
    value: "biannually",
    label: "Biannually",
    short: "6 months",
    discount: "10% off",
  },
  { value: "annually", label: "Annually", short: "year", discount: "15% off" },
];

// Bonus SMS included with every plan.
export const BONUS_SMS = 10;

export const buyerPlans = [
  {
    name: "Bronze",
    prices: { quarterly: 60, biannually: 108, annually: 204 },
    description:
      "Gain the lowest reach into the suppliers’ market with fewer competitive offers.",
    defaultUsers: 1,
    addOnFee: 10,
    branchAddOn: 10,
    competitiveOffers: "1X",
  },
  {
    name: "Silver",
    prices: { quarterly: 75, biannually: 135, annually: 255 },
    description:
      "Gain a lower reach into the suppliers’ market with less competitive offers.",
    defaultUsers: 2,
    addOnFee: 10,
    branchAddOn: 10,
    competitiveOffers: "2X",
  },
  {
    name: "Gold",
    prices: { quarterly: 105, biannually: 189, annually: 357 },
    description:
      "Gain a high reach into the suppliers’ market with highly competitive offers.",
    defaultUsers: 3,
    addOnFee: 10,
    branchAddOn: 10,
    competitiveOffers: "3X",
  },
  {
    name: "Diamond",
    prices: { quarterly: 120, biannually: 216, annually: 408 },
    description:
      "Gain a higher reach into the suppliers’ market with higher competitive offers.",
    defaultUsers: 3,
    addOnFee: 10,
    branchAddOn: 10,
    competitiveOffers: "4X",
    isPopular: true,
  },
  {
    name: "Platinum",
    prices: { quarterly: 150, biannually: 270, annually: 510 },
    description:
      "Gain the highest reach into the suppliers’ market with the highest competitive offers.",
    defaultUsers: 4,
    addOnFee: 10,
    branchAddOn: 10,
    competitiveOffers: "5X",
  },
];

export const supplierPlans = [
  {
    name: "Bronze",
    prices: { quarterly: 75, biannually: 135, annually: 255 },
    description:
      "Gain the lowest reach into the buyers’ market with fewer business opportunities.",
    defaultUsers: 1,
    addOnFee: 10,
    branchAddOn: 10,
    businessOpportunities: "1X",
  },
  {
    name: "Silver",
    prices: { quarterly: 90, biannually: 162, annually: 306 },
    description:
      "Gain a lower reach into the buyers’ market with less business opportunities.",
    defaultUsers: 2,
    addOnFee: 10,
    branchAddOn: 10,
    businessOpportunities: "2X",
  },
  {
    name: "Gold",
    prices: { quarterly: 120, biannually: 216, annually: 408 },
    description:
      "Gain a high reach into the buyers’ market with more business opportunities.",
    defaultUsers: 3,
    addOnFee: 10,
    branchAddOn: 10,
    businessOpportunities: "3X",
  },
  {
    name: "Diamond",
    prices: { quarterly: 150, biannually: 270, annually: 510 },
    description:
      "Gain a higher reach into the buyers’ market with higher business opportunities.",
    defaultUsers: 3,
    addOnFee: 10,
    branchAddOn: 10,
    businessOpportunities: "4X",
    isPopular: true,
  },
  {
    name: "Platinum",
    prices: { quarterly: 180, biannually: 324, annually: 612 },
    description:
      "Gain the highest reach into the buyers’ market with the highest business opportunities.",
    defaultUsers: 4,
    addOnFee: 10,
    branchAddOn: 10,
    businessOpportunities: "5X",
  },
];

export const transporterPlans = [
  {
    name: "Bronze",
    prices: { quarterly: 54, biannually: 97.2, annually: 183.6 },
    description:
      "Gain the lowest reach into the suppliers’ and buyers’ market with fewer business opportunities.",
    defaultUsers: 1,
    addOnFee: 10,
    branchAddOn: 10,
    businessOpportunities: "1X",
  },
  {
    name: "Silver",
    prices: { quarterly: 60, biannually: 108, annually: 204 },
    description:
      "Gain a lower reach into the suppliers’ and buyers’ market with less business opportunities.",
    defaultUsers: 2,
    addOnFee: 10,
    branchAddOn: 10,
    businessOpportunities: "2X",
  },
  {
    name: "Gold",
    prices: { quarterly: 75, biannually: 135, annually: 255 },
    description:
      "Gain a high reach into the suppliers’ and buyers’ market with more business opportunities.",
    defaultUsers: 3,
    addOnFee: 10,
    branchAddOn: 10,
    businessOpportunities: "3X",
  },
  {
    name: "Diamond",
    prices: { quarterly: 105, biannually: 189, annually: 357 },
    description:
      "Gain a higher reach into the suppliers’ and buyers’ market with higher business opportunities.",
    defaultUsers: 3,
    addOnFee: 10,
    branchAddOn: 10,
    businessOpportunities: "4X",
    isPopular: true,
  },
  {
    name: "Platinum",
    prices: { quarterly: 120, biannually: 216, annually: 408 },
    description:
      "Gain the highest reach into the suppliers’ and buyers’ market with the highest business opportunities.",
    defaultUsers: 4,
    addOnFee: 10,
    branchAddOn: 10,
    businessOpportunities: "5X",
  },
];

export const commonFeatures = [
  { name: "Managing User Permissions", included: true },
  { name: "SMS Recharge/Top-up", included: true },
  { name: "Reports", included: true },
  { name: "Two-Way Authentication", included: true },
  { name: "12-Month Support", included: true },
];

export const planTabs = [
  { id: "buyer", label: "Buyer Plans" },
  { id: "supplier", label: "Supplier Plans" },
  { id: "transporter", label: "Transporter Plans" },
];

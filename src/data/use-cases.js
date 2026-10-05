// Industry use cases — from "Website friendly Use Cases.docx" (reviewed copy).
// Rendered by src/pages/public/UseCasesPage.jsx.
import {
  Factory,
  HardHat,
  HeartPulse,
  Store,
  Hotel,
  Truck,
  Pickaxe,
  Fuel,
  RadioTower,
  Cpu,
  GraduationCap,
  Landmark,
  Building2,
  FlaskConical,
  Zap,
  HandHeart,
} from "lucide-react";

export const USE_CASES_INTRO = {
  eyebrow: "Industry use cases",
  title: "One digital procurement platform. Many industries.",
  lead: "Every industry buys differently. But every organisation needs to source effectively, control expenditure, manage suppliers, receive what it ordered, process invoices, make payments and understand its procurement performance.",
  body: "iSourcePlus connects the complete Source-to-Pay lifecycle in one digital platform.",
};

// `manages` is the "Manage …" scope line; `uses` the "Use iSourcePlus to"
// list. Education's source lists categories instead of uses (`usesLabel`).
export const INDUSTRIES = [
  {
    id: "manufacturing",
    name: "Manufacturing",
    icon: Factory,
    tagline: "Keep production supplied.",
    manages:
      "Manage procurement of raw materials, components, packaging, MRO supplies, equipment and services.",
    uses: [
      "Source and compare suppliers",
      "Manage purchase orders",
      "Track deliveries and receiving",
      "Connect procurement with inventory",
      "Monitor supplier performance",
      "Analyse material costs and spend",
    ],
    value: "Better supply continuity, procurement control and cost visibility.",
  },
  {
    id: "construction",
    name: "Construction & Engineering",
    icon: HardHat,
    tagline: "Connect project procurement to project delivery.",
    manages:
      "Manage materials, equipment, subcontractors, professional services and logistics.",
    uses: [
      "Link purchases to projects",
      "Source contractors and suppliers",
      "Manage contracts and POs",
      "Track deliveries and GRNs",
      "Monitor project procurement spend",
      "Analyse supplier and contractor performance",
    ],
    value: "Greater project procurement visibility and expenditure control.",
  },
  {
    id: "healthcare",
    name: "Healthcare",
    icon: HeartPulse,
    tagline: "Make critical procurement traceable.",
    manages:
      "Manage medicines, medical supplies, equipment, laboratory materials, facilities and services.",
    uses: [
      "Manage healthcare requisitions",
      "Source approved suppliers",
      "Track deliveries and receiving",
      "Capture relevant batch, serial and expiry information",
      "Connect procurement with inventory",
      "Monitor supplier performance",
    ],
    value:
      "Better procurement traceability, supply visibility and financial control.",
  },
  {
    id: "retail",
    name: "Retail & Distribution",
    icon: Store,
    tagline: "Connect purchasing with inventory and replenishment.",
    manages:
      "Manage products, suppliers, store supplies, equipment and services.",
    uses: [
      "Manage supplier sourcing",
      "Monitor product purchasing",
      "Connect procurement to inventory",
      "Support replenishment",
      "Analyse supplier pricing",
      "Monitor product and supplier performance",
    ],
    value:
      "Better stock availability, supplier visibility and purchasing intelligence.",
  },
  {
    id: "hospitality",
    name: "Hospitality & Hotels",
    icon: Hotel,
    tagline: "Keep operations supplied.",
    manages:
      "Manage food, beverages, linen, guest amenities, cleaning supplies, maintenance and services.",
    uses: [
      "Manage departmental requisitions",
      "Source suppliers",
      "Compare prices",
      "Track deliveries",
      "Manage receiving",
      "Monitor operating expenditure",
    ],
    value: "Better purchasing visibility and control over operating costs.",
  },
  {
    id: "logistics",
    name: "Logistics & Transport",
    icon: Truck,
    tagline: "Keep fleets and supply chains moving.",
    manages:
      "Manage fuel, tyres, spare parts, maintenance, vehicles, equipment and transport services.",
    uses: [
      "Source fleet requirements",
      "Manage supplier and transporter relationships",
      "Track deliveries",
      "Monitor maintenance expenditure",
      "Analyse fleet-related procurement",
      "Measure supplier performance",
    ],
    value: "Greater visibility over the cost of keeping operations moving.",
  },
  {
    id: "mining",
    name: "Mining",
    icon: Pickaxe,
    tagline: "Connect critical procurement with operations.",
    manages:
      "Manage equipment, spare parts, fuel, PPE, maintenance, engineering and contractor services.",
    uses: [
      "Manage critical requirements",
      "Source specialist suppliers",
      "Track high-value purchases",
      "Monitor supplier lead times",
      "Connect procurement with inventory",
      "Analyse site and category expenditure",
    ],
    value: "Better procurement visibility and operational supply control.",
  },
  {
    id: "oil-gas",
    name: "Oil & Gas",
    icon: Fuel,
    tagline: "Control complex technical procurement.",
    manages:
      "Manage equipment, MRO, engineering, maintenance, specialist services and contractors.",
    uses: [
      "Manage technical requirements",
      "Conduct supplier sourcing",
      "Support technical and commercial evaluation",
      "Manage contracts and POs",
      "Track delivery and receiving",
      "Monitor supplier performance",
    ],
    value: "Greater control over complex, high-value procurement.",
  },
  {
    id: "telecommunications",
    name: "Telecommunications",
    icon: RadioTower,
    tagline: "Connect technology procurement with infrastructure delivery.",
    manages:
      "Manage network equipment, fibre, infrastructure, IT, power systems and professional services.",
    uses: [
      "Manage project procurement",
      "Evaluate suppliers",
      "Track equipment deliveries",
      "Manage contracts",
      "Monitor project expenditure",
      "Analyse supplier performance",
    ],
    value:
      "Better visibility across technology and infrastructure procurement.",
  },
  {
    id: "technology",
    name: "Technology & Digital Services",
    icon: Cpu,
    tagline: "Procure technology with confidence.",
    manages:
      "Manage hardware, software, cloud, cybersecurity, SaaS and professional services.",
    uses: [
      "Source technology suppliers",
      "Manage licences and contracts",
      "Track technology expenditure",
      "Monitor renewals",
      "Manage POs and invoices",
      "Analyse technology spend",
    ],
    value:
      "Better control over technology procurement and supplier commitments.",
  },
  {
    id: "education",
    name: "Education",
    icon: GraduationCap,
    tagline: "Digitise institutional procurement.",
    manages:
      "Support universities, schools, colleges and training organisations.",
    usesLabel: "Manage",
    uses: [
      "ICT",
      "Laboratory equipment",
      "Teaching materials",
      "Furniture",
      "Stationery",
      "Catering",
      "Maintenance",
      "Professional services",
    ],
    value:
      "Connected procurement, supplier management and institutional spend visibility.",
  },
  {
    id: "banking",
    name: "Banking & Financial Services",
    icon: Landmark,
    tagline: "Control procurement across branches and business units.",
    manages:
      "Manage technology, facilities, security, professional services and operational supplies.",
    uses: [
      "Centralise procurement visibility",
      "Manage branch and departmental spend",
      "Control suppliers",
      "Track contracts",
      "Manage invoices and payments",
      "Analyse procurement performance",
    ],
    value: "Stronger procurement governance and enterprise-wide visibility.",
  },
  {
    id: "real-estate",
    name: "Real Estate & Property",
    icon: Building2,
    tagline: "Connect property operations with procurement.",
    manages:
      "Manage maintenance, security, cleaning, landscaping, construction and facility services.",
    uses: [
      "Create maintenance requirements",
      "Source service providers",
      "Manage work orders and POs",
      "Verify completed services",
      "Process invoices",
      "Analyse property expenditure",
    ],
    value: "Better control over property and facility procurement.",
  },
  {
    id: "pharmaceutical",
    name: "Pharmaceutical & Life Sciences",
    icon: FlaskConical,
    tagline: "Connect specialised procurement with supply continuity.",
    manages:
      "Manage laboratory supplies, equipment, packaging, medicines and specialist services.",
    uses: [
      "Manage supplier sourcing",
      "Capture relevant product information",
      "Track receiving",
      "Connect procurement with inventory",
      "Monitor supplier performance",
      "Analyse purchasing trends",
    ],
    value: "Better procurement visibility and supply management.",
  },
  {
    id: "energy",
    name: "Energy & Utilities",
    icon: Zap,
    tagline: "Keep critical infrastructure supplied.",
    manages:
      "Manage equipment, spare parts, maintenance, engineering and specialist services.",
    uses: [
      "Manage operational requirements",
      "Source suppliers",
      "Track critical purchases",
      "Monitor delivery performance",
      "Manage contracts",
      "Analyse procurement expenditure",
    ],
    value:
      "Better visibility over critical procurement and supplier performance.",
  },
  {
    id: "ngos",
    name: "NGOs & Development Organisations",
    icon: HandHeart,
    tagline: "Connect programme procurement with expenditure.",
    manages:
      "Manage project and programme purchasing, suppliers, contracts and services.",
    uses: [
      "Track procurement by programme",
      "Manage suppliers",
      "Connect purchases to projects",
      "Monitor contract utilisation",
      "Track invoices and payments",
      "Generate procurement reports",
    ],
    value: "Better programme procurement visibility and accountability.",
  },
];

export const LIFECYCLE = [
  "Demand",
  "Source",
  "Buy",
  "Fulfil",
  "Receive",
  "Invoice",
  "Pay",
  "Analyse",
];

export const PARTICIPANTS = [
  "Buyers",
  "Suppliers",
  "Transporters",
  "Finance",
  "Inventory",
  "Contracts",
  "Procurement Intelligence",
];

export const UTID_CHAIN = [
  "Requisition",
  "RFQ",
  "Quotation",
  "Evaluation",
  "PO",
  "Delivery",
  "GRN",
  "Inventory",
  "Invoice",
  "Payment",
  "Audit",
];

export const PROCUREMENT_INTELLIGENCE = [
  "Spend",
  "Supplier performance",
  "Price trends",
  "Savings",
  "Contracts",
  "Cycle time",
  "Exceptions",
  "Procurement risk",
];

export const MANAGEMENT_QUESTIONS = [
  "Where are we spending?",
  "Who are we buying from?",
  "What are we paying?",
  "What has been delivered?",
  "What remains outstanding?",
  "Where are the exceptions?",
  "Where can procurement improve?",
];

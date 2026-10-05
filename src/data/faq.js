// Frequently asked questions — from "Web-friendly FAQ_Isourceplus.docx".
// Light copy-edits only (spelling, grammar, numbering, brand name); meaning is
// unchanged. Rendered by src/pages/public/FaqPage.jsx.
//
// An answer is a list of blocks:
//   "text"                      → paragraph
//   { list: [...] }             → bullet list
//   { flow: [...] }             → arrow chain (A → B → C)
//   { steps: [...] }            → numbered steps
//   { text, link: {label, to} } → paragraph ending in an internal link

export const FAQ_SECTIONS = [
  {
    id: "about",
    title: "About iSourcePlus",
    items: [
      {
        q: "What is iSourcePlus?",
        a: [
          "iSourcePlus is a digital Source-to-Pay (S2P) platform that connects organisations with suppliers and service providers across the procurement lifecycle. It helps organisations manage:",
          {
            flow: [
              "Demand",
              "Source",
              "Buy",
              "Fulfil",
              "Receive",
              "Invoice",
              "Pay",
            ],
          },
        ],
      },
      {
        q: "What does Source-to-Pay mean?",
        a: [
          "Source-to-Pay covers the complete procurement journey: identifying a business need, sourcing, purchasing, receiving goods or services, processing invoices and making payment.",
        ],
      },
      {
        q: "Who is iSourcePlus designed for?",
        a: [
          "iSourcePlus is designed for organisations that buy goods, works or services, including:",
          {
            list: [
              "Manufacturing companies",
              "Construction and engineering firms",
              "Healthcare organisations",
              "Retail and distribution businesses",
              "Hotels and hospitality businesses",
              "Logistics and transport companies",
              "Mining companies",
              "Oil and gas companies",
              "Telecommunications companies",
              "Technology companies",
              "Educational institutions",
              "Financial institutions",
              "Real estate organisations",
              "Pharmaceutical and life-science organisations",
              "Energy and utility organisations",
              "NGOs and development organisations",
            ],
          },
          {
            text: "",
            link: { label: "See industry use cases", to: "/use-cases" },
          },
        ],
      },
      {
        q: "Does iSourcePlus only serve large organisations?",
        a: [
          "No. The platform supports organisations of different sizes and procurement environments, from growing businesses to larger enterprises with multiple departments, branches and business units.",
        ],
      },
      {
        q: "What problem does iSourcePlus solve?",
        a: [
          "Many organisations manage procurement information across disconnected emails, spreadsheets, documents, systems and communication channels.",
          "iSourcePlus connects procurement transactions into a structured digital workflow, improving visibility, traceability and control.",
        ],
      },
    ],
  },
  {
    id: "buyers",
    title: "Buyer questions",
    items: [
      {
        q: "What can buyers do on iSourcePlus?",
        a: [
          "Buyers can:",
          {
            list: [
              "Request quotations",
              "Engage suppliers",
              "Receive quotations",
              "Evaluate supplier offers",
              "Create purchase orders",
              "Manage approvals",
              "Track deliveries",
              "Record goods received",
              "Process invoices",
              "Initiate payment workflows",
              "Monitor suppliers",
              "Analyse procurement performance",
            ],
          },
        ],
      },
      {
        q: "Can different departments use the same platform?",
        a: [
          "Yes. Organisations can structure procurement around departments, branches, business units, warehouses, projects, cost centres and authorised users.",
          "Access can be controlled according to roles and permissions.",
        ],
      },
      {
        q: "Can procurement transactions require approval?",
        a: [
          "Yes. The platform has been configured for users to initiate approvals at key decision-making points in the workflow.",
        ],
      },
      {
        q: "Can buyers compare supplier quotations?",
        a: [
          "Yes. Supplier quotations can be captured and evaluated against configured criteria such as:",
          {
            list: [
              "Price",
              "Specification",
              "Delivery",
              "Quality",
              "Commercial terms",
              "Supplier performance",
              "Other approved evaluation criteria",
            ],
          },
        ],
      },
      {
        q: "Can buyers manage purchase orders?",
        a: [
          "Yes. Buyers can create, approve, issue, track and manage purchase orders within the procurement workflow.",
        ],
      },
      {
        q: "Can buyers track what has been ordered and received?",
        a: [
          "Yes. Purchase orders can be connected to delivery and receiving records, so buyers can see the relationship between what was ordered and what was received.",
        ],
      },
    ],
  },
  {
    id: "suppliers",
    title: "Supplier questions",
    items: [
      {
        q: "How do suppliers use iSourcePlus?",
        a: [
          "Suppliers can use the platform to:",
          {
            list: [
              "Receive sourcing opportunities",
              "Submit quotations",
              "Confirm purchase orders",
              "Manage fulfilment",
              "Submit delivery documentation",
              "Issue invoices",
              "Issue payment orders",
              "Track transaction status",
              "Receive payment-related information",
              "Monitor their procurement relationship with buyers",
            ],
          },
        ],
      },
      {
        q: "Can suppliers see their transaction history?",
        a: [
          "Authorised suppliers can access relevant transaction information and records according to their account permissions and the applicable buyer–supplier relationship.",
        ],
      },
      {
        q: "Can suppliers receive purchase orders digitally?",
        a: [
          "Yes. Purchase orders can be issued through the platform and suppliers can respond through the relevant workflow.",
        ],
      },
      {
        q: "Can suppliers submit invoices through iSourcePlus?",
        a: [
          "Yes. Suppliers can submit relevant invoices electronically, subject to the buyer's configured process and applicable requirements.",
        ],
      },
      {
        q: "Can suppliers submit payment orders through iSourcePlus?",
        a: [
          "Yes. Suppliers can serve a payment order electronically on the buyer to effect payment.",
        ],
      },
    ],
  },
  {
    id: "transporters",
    title: "Cargo transporter questions",
    items: [
      {
        q: "How do cargo transporters use iSourcePlus?",
        a: [
          "Cargo transporters can use the platform to:",
          {
            list: [
              "Receive sourcing opportunities",
              "Submit quotations",
              "Confirm purchase orders",
              "Use Google Maps",
              "Submit delivery documentation",
              "Issue invoices",
              "Issue payment orders",
              "Track transaction status",
              "Receive payment-related information",
              "Monitor their procurement relationship with buyers and suppliers",
            ],
          },
        ],
      },
      {
        q: "Can transporters see their transaction history?",
        a: [
          "Authorised transporters can access relevant transaction information and records according to their account permissions and the applicable business relationship.",
        ],
      },
      {
        q: "Can transporters receive purchase orders digitally?",
        a: [
          "Yes. Purchase orders can be issued through the platform and transporters can respond through the relevant workflow.",
        ],
      },
      {
        q: "Can transporters submit invoices through iSourcePlus?",
        a: [
          "Yes. Transporters can submit relevant invoices electronically, subject to the configured process and applicable requirements.",
        ],
      },
      {
        q: "Can transporters submit payment orders through iSourcePlus?",
        a: [
          "Yes. Transporters can serve a payment order electronically on their customer to effect payment.",
        ],
      },
    ],
  },
  {
    id: "workflow",
    title: "Procurement workflow",
    items: [
      {
        q: "What does a typical iSourcePlus transaction look like?",
        a: [
          "A typical transaction can follow:",
          {
            flow: [
              "RFQ",
              "Supplier Quotations",
              "Evaluation",
              "Award",
              "PO",
              "Supplier Confirmation",
              "Delivery",
              "GRN",
              "Invoice",
              "Three-Way Match",
              "Payment",
              "Audit",
            ],
          },
        ],
      },
      {
        q: "Can iSourcePlus support different procurement workflows?",
        a: [
          "No. Workflows have been configured to streamline standard organisational procurement policies and approval structures.",
        ],
      },
      {
        q: "Can procurement transactions be amended?",
        a: [
          "Not yet. Authorised amendments will be configured in due course to support controlled workflows.",
        ],
      },
      {
        q: "Can iSourcePlus support urgent procurement?",
        a: [
          "Organisations can configure appropriate urgent or exception procurement workflows, subject to their internal policies and approval requirements.",
        ],
      },
    ],
  },
  {
    id: "utid",
    title: "Universal Transaction Identity (UTID)",
    items: [
      {
        q: "What is a UTID?",
        a: [
          "UTID means Universal Transaction Identity. It provides a unique transaction reference that can connect related procurement, inventory, finance and audit records.",
        ],
      },
      {
        q: "Why is UTID important?",
        a: [
          "Instead of viewing each document separately, authorised users can follow the connected transaction history. This feature will be configured in due course. For example:",
          {
            flow: [
              "RFQ",
              "Quotation",
              "PO",
              "Delivery",
              "GRN",
              "Invoice",
              "Payment",
              "Audit",
            ],
          },
        ],
      },
      {
        q: "Can users search for a transaction using its UTID?",
        a: [
          "Yes. The UTID can provide a single reference point for authorised users to locate the connected transaction history.",
        ],
      },
      {
        q: "Does every document have to be a UTID?",
        a: [
          "Not necessarily. Individual documents retain their own identities, while the UTID provides the common transaction-level reference connecting related records.",
        ],
      },
    ],
  },
  {
    id: "delivery",
    title: "Delivery & receiving",
    items: [
      {
        q: "Can iSourcePlus track deliveries?",
        a: [
          "Yes. Delivery information can be recorded and connected to the relevant purchase order and transaction.",
        ],
      },
      {
        q: "What is the difference between a delivery note and a GRN?",
        a: [
          "A Goods Delivery Note (GDN) documents the delivery of goods.",
          "A Goods Received Note (GRN) records the buyer's formal receipt and acceptance of goods according to the applicable receiving process.",
        ],
      },
      {
        q: "Does creating a delivery note automatically increase inventory?",
        a: [
          "No. Inventory will be updated through the authorised receiving and inventory workflow.",
        ],
      },
      {
        q: "Can the platform support stock management?",
        a: [
          "Not yet. In due course, the wider iSourcePlus ecosystem will support inventory capabilities including:",
          {
            list: [
              "Stock positions",
              "Reservations",
              "Transfers",
              "Adjustments",
              "Stock counts",
              "Replenishment",
              "Warehouse management",
              "Inventory movements",
              "Inventory reporting",
            ],
          },
        ],
      },
    ],
  },
  {
    id: "payments",
    title: "Invoicing & payments",
    items: [
      {
        q: "Can suppliers or transporters submit invoices after delivery?",
        a: [
          "No. Invoice submission forms part of the pre-delivery procurement workflow, subject to the applicable buyer process. Sales invoices are issued after the buyer serves a purchase order.",
        ],
      },
      {
        q: "What is three-way matching?",
        a: [
          "Three-way matching compares:",
          {
            flow: ["Purchase Order", "Goods Received Note", "Invoice"],
            joiner: "+",
          },
          "The purpose is to establish whether the invoice corresponds with what was ordered and received before payment proceeds through the authorised process.",
        ],
      },
      {
        q: "What happens if the three documents do not match?",
        a: [
          "The transaction can be placed into an exception workflow for review. For example, differences may arise from:",
          {
            list: [
              "Quantity",
              "Price",
              "Tax",
              "Delivery",
              "Specification",
              "Invoice information",
            ],
          },
          "Authorised overrides will require an appropriate reason, authority and audit evidence. The internally configured security mechanism and high information dependency minimise human intervention.",
        ],
      },
      {
        q: "Can iSourcePlus initiate payments?",
        a: [
          "The platform supports payment workflows and is integrated with AppsNmobile, a fintech company licensed by the Bank of Ghana.",
          "Actual movement or custody of funds remains with AppsNmobile's partner banks.",
        ],
      },
      {
        q: "Can buyers track payment status?",
        a: [
          "Authorised users can access relevant payment status and transaction information.",
        ],
      },
    ],
  },
  {
    id: "tax",
    title: "Tax & e-invoicing",
    items: [
      {
        q: "Can iSourcePlus support electronic invoicing?",
        a: [
          "Yes. The platform supports both electronic VAT invoice and non-electronic VAT workflows and integrations, subject to applicable Ghana Revenue Authority tax requirements and available integrations.",
        ],
      },
      {
        q: "Can iSourcePlus integrate with tax systems?",
        a: [
          "Yes. iSourcePlus is integrated with the Ghana Revenue Authority's authorised electronic VAT invoicing system.",
        ],
      },
      {
        q: "Does using iSourcePlus automatically make an organisation tax compliant?",
        a: [
          "No. The platform provides tools and transaction records that support compliance, but each organisation remains responsible for its statutory tax obligations.",
        ],
      },
    ],
  },
  {
    id: "supplier-management",
    title: "Supplier management",
    items: [
      {
        q: "Can buyers evaluate supplier performance?",
        a: [
          "Yes. Supplier performance can be analysed using indicators such as:",
          {
            list: [
              "Order acceptance",
              "Response time",
              "On-time delivery",
              "Quality",
              "Invoice accuracy",
              "Returns",
              "Cancellation",
              "Buyer feedback",
            ],
          },
          "A comprehensive evaluation system will be integrated in due course.",
        ],
      },
      {
        q: "Can buyers identify preferred suppliers?",
        a: [
          "Yes. Organisations can establish authorised supplier classifications such as:",
          {
            list: [
              "Preferred suppliers",
              "Contract suppliers",
              "Framework suppliers",
              "Emergency suppliers",
            ],
          },
          "This is subject to the organisation's procurement policy. This feature will be released in due course.",
        ],
      },
      {
        q: "Can buyers restrict transactions with certain suppliers?",
        a: [
          "Yes. Organisations can configure supplier status and eligibility controls. This feature will be released in due course.",
          "For example, a supplier classified as BLACKLISTED can be prevented from normal procurement selection, subject to authorised exception procedures.",
        ],
      },
    ],
  },
  {
    id: "security",
    title: "Security & access",
    items: [
      {
        q: "How is access controlled?",
        a: [
          "Access can be controlled through:",
          {
            list: [
              "User identity",
              "Roles",
              "Permissions",
              "Organisation or tenant",
              "Business-unit scope",
              "Transaction authority",
            ],
          },
        ],
      },
      {
        q: "Can different users have different permissions?",
        a: [
          "Yes. For example, a requester, buyer, approver, finance officer and administrator can have different permissions.",
        ],
      },
      {
        q: "Does the frontend permission control replace backend security?",
        a: [
          "No. Frontend controls primarily improve the user experience. Authorisation is also enforced on the backend.",
        ],
      },
      {
        q: "Does iSourcePlus support MFA?",
        a: [
          "The platform architecture supports authentication mechanisms including multi-factor authentication where enabled by the relevant implementation.",
        ],
      },
      {
        q: "Is transaction activity auditable?",
        a: [
          "Yes. Material transactions can maintain an audit trail containing relevant information such as:",
          {
            list: [
              "User",
              "Action",
              "Entity",
              "Timestamp",
              "Before/after values where applicable",
              "Reason",
              "Transaction reference",
              "UTID",
            ],
          },
        ],
      },
    ],
  },
  {
    id: "mobile",
    title: "Mobile access",
    items: [
      {
        q: "Is iSourcePlus available on mobile devices?",
        a: [
          "Yes. Users get a mobile-friendly view and can transact just as they would on a desktop or laptop.",
        ],
      },
      {
        q: "Can users work when connectivity is limited?",
        a: [
          "Selected mobile workflows can be designed for offline operation, with synchronisation and conflict handling when connectivity is restored.",
        ],
      },
    ],
  },
  {
    id: "support",
    title: "Customer support",
    items: [
      {
        q: "How do customers get support?",
        a: [
          "Support is provided through authorised iSourcePlus customer service channels, including digital support and customer experience services.",
        ],
      },
      {
        q: "Can users report a problem?",
        a: [
          "Yes. Issues can be recorded as support cases and routed according to the applicable service-level and escalation process.",
        ],
      },
      {
        q: "Can users track their support requests?",
        a: [
          "Where case management is enabled, users can track the status of their support requests and relevant responses.",
        ],
      },
    ],
  },
  {
    id: "commercial",
    title: "Commercial questions",
    items: [
      {
        q: "How is iSourcePlus priced?",
        a: [
          "Pricing depends on the applicable platform package, users, Supplier Market Access, Buyer Market Access, Transporter Market Access and service requirements.",
          {
            text: "See our packages, or contact the iSourcePlus team for the applicable pricing structure.",
            link: { label: "View pricing", to: "/#pricing" },
          },
        ],
      },
      {
        q: "Can an organisation start with selected modules?",
        a: ["All modules are equally available to all respective end users."],
      },
      {
        q: "Can additional users be added later?",
        a: [
          "User access can be expanded subject to the applicable subscription or commercial arrangement.",
        ],
      },
    ],
  },
  {
    id: "responsibility",
    title: "Platform responsibility",
    items: [
      {
        q: "Does iSourcePlus become the buyer or supplier in my transaction?",
        a: [
          "No. iSourcePlus is a technology platform and ecosystem operator. The parties using the platform remain responsible for their own commercial transactions and obligations, subject to applicable agreements and law.",
        ],
      },
      {
        q: "Does iSourcePlus own the goods being purchased?",
        a: [
          "No. Ownership of goods remains governed by the relevant commercial transaction and applicable contractual terms.",
        ],
      },
      {
        q: "Is iSourcePlus a bank or lender?",
        a: [
          "No. Where banking, payment or financing services are provided, they are delivered through our fintech partner, AppsNmobile, with their respective authorised financial institutions or providers.",
        ],
      },
      {
        q: "Does using iSourcePlus guarantee procurement savings?",
        a: [
          "No. The platform provides tools, information and analytics that can support procurement improvement. Actual results depend on the organisation's procurement strategy, decisions, market conditions, supplier behaviour and implementation.",
        ],
      },
    ],
  },
  {
    id: "privacy",
    title: "Data & privacy",
    items: [
      {
        q: "Who controls procurement data?",
        a: [
          "Data responsibilities depend on the nature of the data, the applicable agreement and the role of each party.",
          "Access is restricted according to authorised business requirements and applicable privacy obligations.",
        ],
      },
      {
        q: "Is customer data shared with other organisations?",
        a: [
          {
            text: "Data is shared only where authorised, necessary for the relevant service, required by law, or otherwise permitted under the applicable agreement and privacy terms.",
            link: { label: "Privacy Policy", to: "/privacy" },
          },
        ],
      },
      {
        q: "Can users control who sees procurement information?",
        a: [
          "Access controls can restrict information according to user identity, role, organisation, permissions and applicable business scope.",
        ],
      },
    ],
  },
  {
    id: "getting-started",
    title: "Getting started",
    items: [
      {
        q: "How do I start using iSourcePlus?",
        a: [
          "A typical onboarding process is:",
          {
            steps: [
              "Subscribe to a package of choice",
              "Develop your organisational profile",
              "Train users",
              "Understand your procurement requirements",
              "Select the appropriate tools",
              "Send SMS invitations to invite customers, suppliers and transporters",
              "Go live",
            ],
          },
        ],
      },
      {
        q: "Can I request a demonstration?",
        a: [
          "Yes. Organisations can request a demonstration to explore the relevant iSourcePlus capabilities and workflows.",
        ],
      },
      {
        q: "Can I start with one business unit and expand later?",
        a: [
          "Subject to the selected implementation and commercial arrangement, organisations can phase deployment across departments, locations, business units or other organisational structures.",
        ],
      },
    ],
  },
];

// Quick reference table. `status`: "yes" | "not-yet" | "ecosystem" | "info".
export const QUICK_REFERENCE = [
  { q: "What is it?", a: "Digital Source-to-Pay platform", status: "info" },
  {
    q: "Who is it for?",
    a: "Buyers, suppliers and connected business participants",
    status: "info",
  },
  {
    q: "What does it connect?",
    a: "RFQ → Source → Buy → Fulfil → Receive → Invoice → Pay",
    status: "info",
  },
  { q: "Can it manage suppliers?", a: "Yes", status: "yes" },
  { q: "Can it manage POs?", a: "Yes", status: "yes" },
  { q: "Can it track receiving?", a: "Yes", status: "yes" },
  {
    q: "Can it support inventory integration?",
    a: "Not yet",
    status: "not-yet",
  },
  { q: "Can it support invoice matching?", a: "Not yet", status: "not-yet" },
  { q: "Can it support payment workflows?", a: "Yes", status: "yes" },
  {
    q: "Does it provide procurement intelligence?",
    a: "Not yet",
    status: "not-yet",
  },
  { q: "Does it use UTID?", a: "Yes", status: "yes" },
  {
    q: "Can it support AI decision assistance?",
    a: "Not yet",
    status: "not-yet",
  },
  {
    q: "Can it integrate with other systems?",
    a: "Not yet",
    status: "not-yet",
  },
  { q: "Can it support Power BI?", a: "Not yet", status: "not-yet" },
  { q: "Can it support mobile workflows?", a: "Yes", status: "yes" },
  {
    q: "Can it support SCF?",
    a: "Through the wider ecosystem",
    status: "ecosystem",
  },
  {
    q: "Can it support Procurement Cards?",
    a: "Through the wider ecosystem",
    status: "ecosystem",
  },
];

export const FRAGMENTED_SOURCES = [
  "Emails",
  "Spreadsheets",
  "Documents",
  "Supplier Portals",
  "ERP Systems",
  "Finance Systems",
];

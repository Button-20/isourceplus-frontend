import paper_and_magnifying_glass from "./paperandmagnifyingglass.png";
import shopping_cart from "./shopping-cart_1583277.png";
import paper_and_pen from "./paperandpen.png";
import shield from "./encrypted_2592317.png";
import currency_exchange from "./cash-flow_5070840.png";
import hero from "./hero.jpg";
import exchange from "./exchange.jpg";
import hero1 from "./hero1.png";
import hero2 from "./hero2.png";
import hero3 from "./hero3.png";
import hero4 from "./hero4.png";
import test2 from "./test2.png";
import heroImgRmvBg from "./heroImgRmvBg.png";
import BgImage from "./BgImage.jpg";
import timelineBG from "./timelineBG.webp";
import aboutIMG from "./aboutIMG.jpeg";
import aboutIMG2 from "./aboutIMG2.jpg";
import sarah from "./pexels-divinetechygirl-1181686.jpg";
import john from "./john.jpg";
import emily from "./emily.jpg";
import mike from "./mike.jpg";
import lock_phone from "./lock_phone.png";
import id_card from "./id-card.png";
import envelope from "./envelope.png";
import data_protection from "./data-protection.png";
import ISlogo from "./ISlogo.png";
import IS from "./IS.png";
import heroImageOG from "./heroImageOG.png";
import animationHero from "./Animation - 1736512676896.json";

export const assets = {
  hero,
  hero3,
  test2,
  hero2,
  hero4,
  heroImgRmvBg,
  BgImage,
  timelineBG,
  aboutIMG,
  aboutIMG2,
  ISlogo,
  IS,
  heroImageOG,
  exchange,
  animationHero,
};

export const features = [
  {
    id: 1,
    title: "Request Quotes from Suppliers",
    icon: paper_and_pen,
    delay: 0.3,
    description:
      "Easily create and send requests to suppliers, compare their offers, and choose the best deal for your needs.",
  },
  {
    id: 2,
    title: "Post Bids for Projects",
    icon: paper_and_magnifying_glass,
    delay: 0.3,
    description:
      "Post project requirements to receive competitive offers from suppliers, ensuring the best value for your work.",
  },
  {
    id: 3,
    title: "Browse Supplier Products",
    icon: shopping_cart,
    delay: 0.3,
    description:
      "Suppliers can showcase their product catalogs for buyers to explore and find the best goods and services.",
  },
  {
    id: 4,
    title: "Manage Transactions Easily",
    icon: currency_exchange,
    delay: 0.3,
    description:
      "Track and handle all your requests, orders, invoices, payments, and receipts in one simple system.",
  },
  {
    id: 5,
    title: "Enhanced Security and Privacy",
    icon: shield,
    delay: 0.3,
    description:
      "Your data and transactions are protected with top-level security and encryption to keep everything safe.",
  },
];

export const testimonials = [
  {
    name: "Sarah L.",
    position: "Sourcing Manager at XYZ Corp.",
    quote:
      "I-Source Plus revolutionized our sourcing process. We found top-quality suppliers with just a few clicks.",
    delay: 0.2,
    image: sarah,
    rating: "⭐⭐⭐⭐",
  },
  {
    name: "John D.",
    position: "Procurement Lead at ABC Ltd.",
    quote:
      "The platform made it easier than ever to manage RFQs and tenders. It streamlined our entire procurement workflow.",
    delay: 0.5,
    image: john,
    rating: "⭐⭐⭐⭐⭐",
  },
  {
    name: "Emily P.",
    position: "Supply Chain Director at GlobalTech",
    quote:
      "I was able to quickly compare offers and secure the best deals for our projects, saving us both time and money.",
    delay: 0.8,
    image: emily,
    rating: "⭐⭐⭐⭐",
  },
  {
    name: "Michael R.",
    position: "Head of Procurement at Tech Solutions",
    quote:
      "Thanks to I-Source Plus, we have a comprehensive view of suppliers and their offerings. It's a game-changer for our business.",
    delay: 1.1,
    image: mike,
    rating: "⭐⭐⭐⭐⭐",
  },
];

export const events = [
  {
    title: "Procurement Best Practices Webinar",
    date: "Date",
    cta: "Register Now",
  },
  {
    title: "Supplier Onboarding Training",
    date: "Date",
    cta: "Register Now",
  },
  {
    title: "Global Sourcing Strategies Conference",
    date: "Date",
    cta: "Register Now",
  },
];

export const security = [
  {
    title: "Two-Factor Authentication",
    content:
      "iSource Plus offers two-factor authentication to secure administrator accounts with dual identity verification.",
    image: lock_phone,
  },
  {
    title: "Document Verification",
    content:
      "Ensures trust by verifying buyer and supplier documents like the Ghana Card during onboarding.",
    image: id_card,
  },
  {
    title: "End-to-End Encryption",
    content:
      "Protects all communications and transactions from interception by encrypting data.",
    image: envelope,
  },
  {
    title: "Regulatory Compliance",
    content:
      "iSource Plus adheres to data protection and privacy regulations to safeguard sensitive information.",
    image: data_protection,
  },
];

export const pricingData = [
  {
    title: "Bronze",
    price: 15,
    features: [
      { text: "1 Default Users", included: true },
      { text: "SMS (0.30/sms)", included: true },
      { text: "User Add-on (1 = GHC 10)", included: true },
      { text: "Managing User Permissions", included: false },
      { text: "Reports", included: false },
      { text: "Two-way Authentication", included: false },
      { text: "12-month Support", included: false },
    ],
  },
  {
    title: "Silver",
    price: 20,
    features: [
      { text: "2 Default Users", included: true },
      { text: "SMS (0.30/sms)", included: true },
      { text: "User Add-on (1 = GHC 10)", included: true },
      { text: "Managing User Permissions", included: true },
      { text: "Reports", included: true },
      { text: "Two-way Authentication", included: false },
      { text: "12-month Support", included: false },
    ],
  },
  {
    title: "Diamond",
    price: 25,
    features: [
      { text: "3 Default Users", included: true },
      { text: "SMS (0.30/sms)", included: true },
      { text: "User Add-on (1 = GHC 10)", included: true },
      { text: "Managing User Permissions", included: true },
      { text: "Reports", included: true },
      { text: "Two-way Authentication", included: true },
      { text: "12-month Support", included: true },
    ],
    isPopular: true,
    isSelected: true,
  },
  {
    title: "Gold",
    price: 30,
    features: [
      { text: "4 Default Users", included: true },
      { text: "SMS (0.30/sms)", included: true },
      { text: "User Add-on (1 = GHC 10)", included: true },
      { text: "Managing User Permissions", included: true },
      { text: "Reports", included: true },
      { text: "Two-way Authentication", included: true },
      { text: "12-month Support", included: true },
    ],
  },
  {
    title: "Platinum",
    price: 35,
    features: [
      { text: "5 Default Users", included: true },
      { text: "SMS (0.30/sms)", included: true },
      { text: "User Add-on (1 = GHC 10)", included: true },
      { text: "Managing User Permissions", included: true },
      { text: "Reports", included: true },
      { text: "Two-way Authentication", included: true },
      { text: "12-month Support", included: true },
    ],
  },
];

import { Users } from "lucide-react";
import React from "react";
import { MdOutlineEmail } from "react-icons/md";
import {
  CiInstagram,
  CiLinkedin,
  CiLocationOn,
  CiPhone,
  CiTwitter,
} from "react-icons/ci";
import { assets } from "@/assets/assets";

const socialLinks = [
  { icon: CiInstagram, href: "#", label: "Instagram" },
  { icon: CiLinkedin, href: "#", label: "LinkedIn" },
  { icon: CiTwitter, href: "#", label: "Twitter" },
];

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className=" text-white py-10">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Logo and Description Section */}
        <div className="flex flex-col items-center md:items-start text-center">
          <img src={assets.ISlogo} alt="" className="w-32" />

          <p className="text-gray-400 text-sm sm:mr-10">
            The most Comprehensive Suppliers' and Buyers' Network
          </p>
        </div>

        {/* Links Section */}
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-4">Quick Links</h2>
          <ul className="space-y-2">
            <li className="hover:underline">
              <a href="#" className="text-gray-400">
                Terms and Conditions
              </a>
            </li>
            <li className="hover:underline">
              <a href="#" className="text-gray-400">
                Privacy Policy
              </a>
            </li>
            <li className="hover:underline">
              <a href="#" className="text-gray-400">
                FAQs
              </a>
            </li>
            <li className="hover:underline">
              <a href="#" className="text-gray-400">
                Contact Us
              </a>
            </li>
          </ul>
        </div>

        {/* Contact Info Section */}
        <div className="text-center md:text-right">
          <h2 className="text-lg font-semibold mb-4">Contact Info</h2>
          <p className="text-gray-400 text-sm">123 Main Street, Accra, Ghana</p>
          <p className="text-gray-400 text-sm">+233 111 1111</p>
          <p className="text-gray-400 text-sm">support@example.com</p>
          <button
            onClick={handleScrollToTop}
            className="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-900 bg-gray-300 rounded hover:bg-gray-400"
          >
            Back to Top
          </button>
        </div>
      </div>

      {/* Bottom Section: Social Links and Copyright */}
      <div className="border-t border-gray-700 mt-8 pt-6">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between">
          {/* Social Links */}
          <div className="flex gap-3 mb-4 md:mb-0">
            {socialLinks.map(({ icon: Icon, href, label }, index) => (
              <a
                key={index}
                href={href}
                className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-800 hover:bg-gray-700"
                aria-label={label}
                title={label}
              >
                <Icon size={24} />
              </a>
            ))}
          </div>

          {/* Copyright Text */}
          <p className="text-sm text-gray-400">
            &copy; {currentYear} iSourcePlus. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

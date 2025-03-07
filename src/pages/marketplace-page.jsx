import React from "react";
import NavBar from "@/components/landing/navBar/Navbar";
import Footer from "@/components/footer/Footer";
import Marketplace from "@/components/marketplace/Marketplace";

export function MarketplacePage() {
  return (
    <div className="overflow-x-hidden">
      <NavBar />
      <Marketplace />
      <div className="bg-black">
        <div className="py-10 container">
          <Footer />
        </div>
      </div>
    </div>
  );
}

import { assets, features } from "@/assets/assets";
import About from "@/components/about/About";
import Clients_no from "@/components/clients_no";
import Footer from "@/components/footer/Footer";
import SecurityFeatures from "@/components/keyFeatures/KeyFeatures";
import Hero from "@/components/landing/hero/Hero";
import NavBar from "@/components/landing/navBar/Navbar";
import Pricing from "@/components/Pricing";
import Features from "@/components/security_compliance/security1";
import Testimonial from "@/components/Testimonials/Testimonial";
import Timeline from "@/components/timeline/Timeline";
import { useApiContext } from "@/contexts/api.context";
import Cookies from "js-cookie";
import { useState, useEffect } from "react";

const bgStyle = {
  backgroundImage: `url(${assets.BgImage})`,
  backgroundRepeat: "no-repeat",
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundAttachment: "fixed",
};

  

export function LandingPage() {
  const [backgroundFilter, setBackgroundFilter] = useState("none");

  useEffect(() => {
    // This will show all accessible cookies
    console.log('Raw cookies:', document.cookie);
    
    // Manually check for your token
    const cookieValue = document.cookie
      .split('; ')
      .find(row => row.startsWith('token='))
      ?.split('=')[1];
    console.log('Manual token check:', cookieValue);
  }, []);

  useEffect(() => {
    console.log('All cookies:', Cookies.get());
    console.log('token:',   Cookies.get('token'));
  }, []);

  useEffect(() => {
    const updateBackgroundFilter = () => {
      if (window.innerWidth < 768) {
        setBackgroundFilter("blur(8px)"); //  mobile blur
      } else {
        setBackgroundFilter("none");
      }
    };

    // Set initial filter
    updateBackgroundFilter();

    // Listen for window resize
    window.addEventListener("resize", updateBackgroundFilter);
    return () => {
      window.removeEventListener("resize", updateBackgroundFilter);
    };
  }, []);

  return (
    <div className="overflow-x-hidden">
      <div style={bgStyle}>
        <NavBar />
        <div id="hero" className="container rounded-3xl">
          <Hero />
        </div>
      </div>
      <div className="container py-5">
        <Clients_no />
      </div>
      <div className="bg-gray-200" id="about">
        <About />
      </div>
      <div id="features" style={bgStyle}>
        <Features />
      </div>
      <div id="how-it-works" style={{ position: "relative" }}>
        {/* Background Wrapper */}
        <div
          style={{
            backgroundImage: `url(${assets.timelineBG})`,
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundAttachment: "fixed",
            filter: backgroundFilter,
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: -1,
          }}
        />
        {/* Timeline Content */}
        <div className="py-10 relative z-10">
          <Timeline />
        </div>
      </div>
      <div>
        <Pricing />
      </div>
      <div id="security" className="bg-gray-200">
        <div className="py-10 container">
          <SecurityFeatures />
        </div>
      </div>
      <div id="user-reviews" className="py-10 container">
        <Testimonial />
      </div>
      <div className="bg-black">
        <div id="" className="py-10 container">
          <Footer />
        </div>
      </div>
    </div>
  );
}

import LandingNav from "@/components/landing/LandingNav";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import SecuritySection from "@/components/landing/SecuritySection";
import PricingTeaser from "@/components/landing/PricingTeaser";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import LandingFooter, { CtaBanner } from "@/components/landing/LandingFooter";
import PartnersSection from "@/components/landing/PartnersSection";
import useHashScroll from "@/components/landing/useHashScroll";

export function LandingPage() {
  // Arriving from another page via "/#pricing" etc. scrolls to that section.
  useHashScroll({ topWhenNoHash: false });
  return (
    <div className="font-montserrat">
      <LandingNav />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <SecuritySection />
        <PricingTeaser />
        <TestimonialsSection />
        <PartnersSection />
        <CtaBanner />
      </main>
      <LandingFooter />
    </div>
  );
}

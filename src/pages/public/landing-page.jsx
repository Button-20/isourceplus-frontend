import LandingNav from "@/components/landing/LandingNav";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import SecuritySection from "@/components/landing/SecuritySection";
import PricingTeaser from "@/components/landing/PricingTeaser";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import LandingFooter, { CtaBanner } from "@/components/landing/LandingFooter";

export function LandingPage() {
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
        <CtaBanner />
      </main>
      <LandingFooter />
    </div>
  );
}

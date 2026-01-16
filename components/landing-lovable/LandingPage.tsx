import Navbar from "@/components/landing-lovable/Navbar";
import Hero from "@/components/landing-lovable/Hero";
import SocialProof from "@/components/landing-lovable/SocialProof";
import ProblemStatement from "@/components/landing-lovable/ProblemStatement";
import Features from "@/components/landing-lovable/Features";
import ProductShowcase from "@/components/landing-lovable/ProductShowcase";
import ViixiShowcase from "@/components/landing-lovable/ViixiShowcase";
import BuiltForTeams from "@/components/landing-lovable/BuiltForTeams";
import TargetAudience from "@/components/landing-lovable/TargetAudience";
import Pricing from "@/components/landing-lovable/Pricing";
import Testimonials from "@/components/landing-lovable/Testimonials";
import FAQ from "@/components/landing-lovable/FAQ";
import FinalCTA from "@/components/landing-lovable/FinalCTA";
import Footer from "@/components/landing-lovable/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <SocialProof />
      <ProblemStatement />
      <Features />
      <ProductShowcase />
      <ViixiShowcase />
      <BuiltForTeams />
      <TargetAudience />
      <Pricing />
      <Testimonials />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
};

export default Index;

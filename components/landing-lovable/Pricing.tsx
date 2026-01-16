"use client";

import { motion } from "framer-motion";
import { Check, Sparkles, ArrowRight } from "lucide-react";

const plans = [
  {
    name: "Basic",
    price: "₹0",
    originalPrice: "₹250",
    period: "/month",
    description: "Perfect for getting started",
    features: [
      "1 Workspace",
      "3 Team Members",
      "30 Vixi Sparks/month",
      "5GB Storage",
    ],
    cta: "Claim Free Plan",
    popular: false,
    hasOffer: true,
  },
  {
    name: "Pro",
    price: "₹799",
    period: "/month",
    description: "For growing content teams",
    features: [
      "3 Workspaces",
      "10 Team Members",
      "300 Vixi Sparks/month",
      "50GB Storage",
      "Priority Support",
    ],
    cta: "Start Pro Trial",
    popular: true,
  },
  {
    name: "Custom",
    price: "Custom",
    period: "",
    description: "For large organizations",
    features: [
      "Unlimited Workspaces",
      "Unlimited Team Members",
      "Unlimited Vixi Sparks",
      "Unlimited Storage",
      "Dedicated Account Manager",
      "Custom Integrations",
      "SLA & Priority Support",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

const Pricing = () => {
  return (
    <section id="pricing" className="section-padding relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10 bg-muted/30" />
      <div className="absolute bottom-0 left-0 right-0 h-[500px] bg-gradient-to-t from-primary/5 to-transparent -z-10" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <motion.span
            className="inline-block px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            Pricing
          </motion.span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            Simple pricing.{" "}
            <span className="gradient-text">Powerful features.</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Start free, upgrade as you grow. No hidden fees.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              className={`relative rounded-3xl bg-card border ${plan.popular
                  ? "border-primary/50 shadow-glow-lg scale-105 z-10"
                  : "border-border/50"
                } p-8 lg:p-10 card-hover`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              {plan.popular && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full gradient-bg text-primary-foreground text-sm font-medium shadow-lg">
                    <Sparkles className="w-4 h-4" />
                    Most Popular
                  </span>
                </div>
              )}

              {plan.hasOffer && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-medium shadow-lg animate-pulse">
                    <Sparkles className="w-4 h-4" />
                    Limited Time Offer
                  </span>
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                <p className="text-muted-foreground text-sm">{plan.description}</p>
              </div>

              <div className="mb-8">
                {plan.originalPrice && (
                  <span className="text-2xl text-muted-foreground line-through mr-2">
                    {plan.originalPrice}
                  </span>
                )}
                <span className="text-5xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground text-lg">{plan.period}</span>
              </div>

              <ul className="space-y-4 mb-10">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <motion.a
                href="/signup"
                className={`flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-medium transition-all duration-300 ${plan.popular
                    ? "btn-primary"
                    : "btn-secondary"
                  }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {plan.cta}
                <ArrowRight className="w-4 h-4" />
              </motion.a>
            </motion.div>
          ))}
        </div>

        <motion.p
          className="text-center text-sm text-muted-foreground mt-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          * Vixi Sparks = AI content idea generations
        </motion.p>
      </div>
    </section>
  );
};

export default Pricing;

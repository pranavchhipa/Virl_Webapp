"use client";

import { motion } from "framer-motion";
import { ArrowRight, CreditCard, Clock, Shield, Sparkles } from "lucide-react";

const badges = [
  { icon: CreditCard, text: "No credit card required" },
  { icon: Clock, text: "Free forever on Basic" },
  { icon: Shield, text: "Cancel anytime" },
];

const FinalCTA = () => {
  return (
    <section className="section-padding relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-gradient-to-r from-primary/20 via-secondary/15 to-primary/20 rounded-full blur-[150px]"
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="relative text-center max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Decorative element */}
          <motion.div
            className="absolute -top-20 left-1/2 -translate-x-1/2"
            animate={{ y: [-10, 10, -10] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center shadow-glow">
              <Sparkles className="w-8 h-8 text-primary-foreground" />
            </div>
          </motion.div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 pt-8">
            Ready to make your content{" "}
            <span className="gradient-text">go viral?</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Join 50+ teams already creating better content, faster.
          </p>

          <motion.a
            href="/signup"
            className="btn-primary text-lg px-10 py-5 inline-flex"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Start Your Free Trial
            <ArrowRight className="w-5 h-5" />
          </motion.a>

          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-8 mt-14">
            {badges.map((badge, index) => (
              <motion.div
                key={badge.text}
                className="flex items-center gap-3 text-muted-foreground"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <badge.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="font-medium">{badge.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FinalCTA;

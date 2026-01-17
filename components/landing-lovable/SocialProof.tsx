"use client";

import { motion } from "framer-motion";
import { Users, FileText, Star } from "lucide-react";

const stats = [
  { icon: Users, label: "50+ Teams", value: "Active Users" },
  { icon: FileText, label: "10,000+", value: "Posts Created" },
  { icon: Star, label: "4.9★", value: "Average Rating" },
];

const trustedPartners = [
  { name: "Rectangled", logo: "/assets/rectangled-logo.png" },
  { name: "JoinDevOps", logo: "/assets/joindevops-logo.png" },
];

const SocialProof = () => {
  return (
    <section className="py-20 border-y border-border/50 bg-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.p
          className="text-center text-muted-foreground mb-10 text-lg"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Trusted by growing content teams
        </motion.p>

        <div className="flex flex-wrap items-center justify-center gap-10 md:gap-20 mb-14">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              className="flex items-center gap-4"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <stat.icon className="w-7 h-7 text-primary" />
              </div>
              <div>
                <div className="font-bold text-xl text-foreground">{stat.label}</div>
                <div className="text-sm text-muted-foreground">{stat.value}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trusted Partners Logos */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="pt-10 border-t border-border/40"
        >
          <p className="text-center text-sm text-muted-foreground mb-10 uppercase tracking-widest font-medium">
            Trusted Partners
          </p>

          {/* Partners Logos */}
          <div className="flex items-center justify-center gap-10 md:gap-16 lg:gap-24">
            {trustedPartners.map((partner, index) => (
              <motion.div
                key={partner.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="group px-6 py-4 rounded-2xl hover:bg-muted/50 transition-all duration-300 flex items-center justify-center"
              >
                <img
                  src={partner.logo}
                  alt={partner.name}
                  className="h-10 md:h-14 lg:h-16 w-auto object-contain opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default SocialProof;

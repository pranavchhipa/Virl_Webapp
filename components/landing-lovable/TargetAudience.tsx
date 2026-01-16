"use client";

import { motion } from "framer-motion";
import { Layers, Briefcase, Sparkles } from "lucide-react";

const audiences = [
  {
    icon: Layers,
    headline: "Social Media Managers",
    description: "Stop chasing approvals in WhatsApp and email. Centralize your content calendar, getting client sign-off 3x faster with our seamless review portal.",
    gradient: "from-purple-500 to-indigo-600",
    glowColor: "hsl(265 89% 62% / 0.3)",
  },
  {
    icon: Briefcase,
    headline: "Creative Agencies",
    description: "Manage multiple client workspaces in one dashboard. Deliver a white-glove experience with custom branding and automated reporting.",
    gradient: "from-indigo-500 to-blue-600",
    glowColor: "hsl(250 84% 54% / 0.3)",
  },
  {
    icon: Sparkles,
    headline: "Solo Creators & Influencers",
    description: "Let Vixi AI handle your scripting and strategy while you focus on filming. Turn one viral idea into a multi-platform campaign instantly.",
    gradient: "from-violet-500 to-purple-600",
    glowColor: "hsl(280 85% 55% / 0.3)",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

const TargetAudience = () => {
  return (
    <section id="audience" className="section-padding relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 mesh-gradient opacity-60" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 lg:mb-20"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-6"
          >
            <Sparkles className="w-4 h-4" />
            Built for Teams That Ship
          </motion.span>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-5 tracking-tight">
            Built for{" "}
            <span className="gradient-text">High-Performance</span>
            {" "}Content Teams
          </h2>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Whether you're scaling a brand or managing multiple clients, Virl streamlines your entire creative workflow.
          </p>
        </motion.header>

        {/* Cards Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto"
        >
          {audiences.map((audience, index) => (
            <motion.article
              key={audience.headline}
              variants={cardVariants}
              className="group relative"
            >
              {/* Card Glow Effect */}
              <div
                className="absolute -inset-0.5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"
                style={{ background: audience.glowColor }}
              />

              {/* Card */}
              <div className="relative h-full bg-card border border-border rounded-3xl p-8 lg:p-10 transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-xl group-hover:border-primary/20 overflow-hidden">
                {/* Subtle gradient overlay on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-500 bg-gradient-to-br from-primary to-secondary" />

                {/* Icon Container */}
                <div className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${audience.gradient} p-0.5 mb-7 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                  <div className="w-full h-full rounded-2xl bg-card flex items-center justify-center">
                    <audience.icon className="w-7 h-7 text-primary" strokeWidth={1.5} />
                  </div>
                  {/* Icon glow */}
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${audience.gradient} opacity-0 group-hover:opacity-40 blur-xl transition-opacity duration-500`} />
                </div>

                {/* Content */}
                <h3 className="text-xl lg:text-2xl font-semibold text-foreground mb-4 transition-colors duration-300 group-hover:text-primary">
                  {audience.headline}
                </h3>

                <p className="text-muted-foreground leading-relaxed text-base lg:text-lg">
                  {audience.description}
                </p>

                {/* Decorative corner accent */}
                <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-primary/5 to-transparent rounded-tl-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            </motion.article>
          ))}
        </motion.div>

        {/* Bottom decorative element */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="flex justify-center mt-16"
        >
          <div className="flex items-center gap-3 text-muted-foreground text-sm">
            <div className="w-12 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
            <span>Trusted by 500+ teams worldwide</span>
            <div className="w-12 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TargetAudience;

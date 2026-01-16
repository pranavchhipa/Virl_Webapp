"use client";

import { motion } from "framer-motion";
import { Layers, Building2, Sparkles } from "lucide-react";

const teamCards = [
  {
    icon: Layers,
    title: "Social Media Managers",
    description: "Stop chasing approvals in WhatsApp and email. Centralize your content calendar, getting client sign-off 3x faster with our seamless review portal.",
  },
  {
    icon: Building2,
    title: "Creative Agencies",
    description: "Manage multiple client workspaces in one dashboard. Deliver a white-glove experience with custom branding and automated reporting.",
  },
  {
    icon: Sparkles,
    title: "Solo Creators & Influencers",
    description: "Let Vixi AI handle your scripting and strategy while you focus on filming. Turn one viral idea into a multi-platform campaign instantly.",
  },
];

const BuiltForTeams = () => {
  return (
    <section id="teams" className="py-24 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Built for Teams That Ship
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mb-6">
            Built for <span className="text-gradient italic">High-Performance</span> Content Teams
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Whether you're scaling a brand or managing multiple clients, Virl streamlines your entire creative workflow.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {teamCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <card.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-4">{card.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{card.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BuiltForTeams;

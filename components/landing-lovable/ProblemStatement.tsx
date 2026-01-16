"use client";

import { motion } from "framer-motion";
import { RefreshCw, Clock, Frown } from "lucide-react";

const problems = [
  {
    icon: RefreshCw,
    title: "Endless Revisions",
    description: "Clients request changes via email, DMs, and calls. Nothing is centralized.",
  },
  {
    icon: Clock,
    title: "Time Drain",
    description: "Hours spent on admin instead of creating great content.",
  },
  {
    icon: Frown,
    title: "Creative Burnout",
    description: "Ideation becomes exhausting when you're doing everything manually.",
  },
];

const ProblemStatement = () => {
  return (
    <section className="section-padding relative overflow-hidden">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background via-muted/20 to-background" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            Content chaos is{" "}
            <span className="gradient-text">killing your creativity</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Sound familiar? You're not alone. Most content teams struggle with these daily challenges.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {problems.map((problem, index) => (
            <motion.div
              key={problem.title}
              className="group text-center p-10 rounded-3xl bg-card border border-border/50 card-hover relative overflow-hidden"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              {/* Hover effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-destructive/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-destructive/20 to-destructive/10 flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-500">
                  <problem.icon className="w-10 h-10 text-destructive" />
                </div>
                <h3 className="text-2xl font-semibold mb-4">{problem.title}</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">{problem.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProblemStatement;

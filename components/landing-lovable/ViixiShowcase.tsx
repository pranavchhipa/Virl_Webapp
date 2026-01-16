"use client";

import { motion } from "framer-motion";
import { Sparkles, Target, Lightbulb, FileText, ArrowRight } from "lucide-react";

const steps = [
  {
    icon: Target,
    step: "1",
    title: "Tell Vixi your goal",
    description: '"I need an Instagram Reel about productivity"',
  },
  {
    icon: Lightbulb,
    step: "2",
    title: "Choose your angle",
    description: "Vixi suggests 5 creative hooks",
  },
  {
    icon: FileText,
    step: "3",
    title: "Get a full strategy",
    description: "Complete script, timeline, and posting tips",
  },
];

const ViixiShowcase = () => {
  return (
    <section className="section-padding relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-0 w-[600px] h-[600px] bg-gradient-to-r from-primary/10 to-transparent rounded-full blur-3xl -translate-y-1/2" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
          {/* Left - Interactive Demo */}
          <motion.div
            className="flex-1 w-full max-w-xl"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="relative">
              <div className="absolute -inset-6 bg-gradient-to-r from-primary/30 via-secondary/20 to-primary/30 rounded-[2.5rem] blur-3xl opacity-60" />

              <div className="relative bg-card rounded-3xl border border-white/20 overflow-hidden shadow-2xl backdrop-blur-sm">
                {/* Chat Header */}
                <div className="flex items-center gap-4 p-5 border-b border-border/50 bg-muted/30">
                  <div className="w-12 h-12 rounded-2xl gradient-bg flex items-center justify-center shadow-lg">
                    <Sparkles className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <div className="font-semibold text-lg">Vixi AI</div>
                    <div className="text-sm text-green-500 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      Online
                    </div>
                  </div>
                </div>

                {/* Chat Messages */}
                <div className="p-5 space-y-4 h-[380px] overflow-y-auto">
                  <motion.div
                    className="bg-muted/60 rounded-2xl rounded-bl-md p-4 max-w-[85%]"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                  >
                    <p className="text-sm">I need viral content ideas for launching our new productivity app on TikTok</p>
                  </motion.div>

                  <motion.div
                    className="bg-gradient-to-br from-primary/15 to-secondary/10 rounded-2xl rounded-br-md p-5 ml-auto max-w-[85%] border border-primary/20"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                  >
                    <p className="text-sm mb-4">🎯 Perfect! Here are 5 viral-worthy hooks for your productivity app launch:</p>
                    <div className="space-y-3 text-sm text-muted-foreground">
                      <div className="flex items-start gap-3 p-3 bg-background/50 rounded-xl">
                        <span className="gradient-text font-bold">1.</span>
                        <span>"I tried every productivity app so you don't have to..."</span>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-background/50 rounded-xl">
                        <span className="gradient-text font-bold">2.</span>
                        <span>"POV: You finally found the app that actually works"</span>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-background/50 rounded-xl">
                        <span className="gradient-text font-bold">3.</span>
                        <span>"The 2-minute rule changed my entire workflow"</span>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    className="bg-muted/60 rounded-2xl rounded-bl-md p-4 max-w-[85%]"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.6 }}
                  >
                    <p className="text-sm">Love hook #2! Can you create a full script for it?</p>
                  </motion.div>
                </div>

                {/* Input */}
                <div className="p-5 border-t border-border/50 bg-muted/20">
                  <div className="flex items-center gap-3 bg-background rounded-2xl px-5 py-3 border border-border/50">
                    <input
                      type="text"
                      placeholder="Ask Vixi anything..."
                      className="flex-1 bg-transparent text-sm outline-none"
                      disabled
                    />
                    <button className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center shadow-lg hover:shadow-glow transition-shadow">
                      <ArrowRight className="w-5 h-5 text-primary-foreground" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right - Content */}
          <motion.div
            className="flex-1"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-8">
              <Sparkles className="w-4 h-4" />
              <span>AI-Powered</span>
            </div>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Meet Vixi — Your{" "}
              <span className="gradient-text">AI Content Strategist</span>
            </h2>

            <p className="text-xl text-muted-foreground mb-12 leading-relaxed">
              Stop staring at blank screens. Vixi generates viral content ideas tailored to your brand, platform, and audience.
            </p>

            {/* Steps */}
            <div className="space-y-6 mb-12">
              {steps.map((item, index) => (
                <motion.div
                  key={item.step}
                  className="flex items-start gap-5 p-5 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-colors"
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center flex-shrink-0 shadow-lg">
                    <span className="text-primary-foreground font-bold text-lg">{item.step}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-1">{item.title}</h4>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.a
              href="/signup"
              className="btn-primary text-base"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Try Vixi Free
              <ArrowRight className="w-5 h-5" />
            </motion.a>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ViixiShowcase;

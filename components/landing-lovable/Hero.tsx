"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Play, ArrowRight, Sparkles, Zap, TrendingUp, Users, Rocket, Target, BarChart3 } from "lucide-react";
import { useState, useEffect } from "react";

const phrases = [
  "Where Ideas Go Viral",
  "Content That Converts",
  "AI-Powered Social Success",
  "Your Content, 10x Faster",
  "Collaborate & Dominate",
  "Ideas Into Engagement"
];

const subheadline = "The AI-powered workspace where content teams collaborate, create, and launch social media campaigns that actually get results.";

const Hero = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isTypingComplete, setIsTypingComplete] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % phrases.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Typewriter effect for subheadline
  useEffect(() => {
    let currentChar = 0;
    const typingInterval = setInterval(() => {
      if (currentChar <= subheadline.length) {
        setDisplayedText(subheadline.slice(0, currentChar));
        currentChar++;
      } else {
        setIsTypingComplete(true);
        clearInterval(typingInterval);
      }
    }, 30);

    return () => clearInterval(typingInterval);
  }, []);

  return (
    <section className="relative min-h-screen flex items-start lg:items-center justify-center overflow-hidden pt-32 lg:pt-20">
      {/* Mesh Gradient Background */}
      <div className="absolute inset-0 -z-10 mesh-gradient" />

      {/* Animated Gradient Orbs */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <motion.div
          className="absolute top-1/4 -left-32 w-[500px] h-[500px] bg-gradient-to-r from-primary/30 to-secondary/20 rounded-full blur-[100px]"
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 -right-32 w-[600px] h-[600px] bg-gradient-to-l from-secondary/25 to-primary/15 rounded-full blur-[120px]"
          animate={{
            x: [0, -40, 0],
            y: [0, -40, 0],
            scale: [1, 1.15, 1]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-primary/10 to-transparent rounded-full blur-[80px]"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Floating Shapes */}
      <motion.div
        className="absolute top-32 left-[15%] w-20 h-20 rounded-3xl gradient-bg opacity-80 shadow-glow"
        animate={{ y: [-15, 15, -15], rotate: [0, 8, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-48 right-[20%] w-14 h-14 rounded-full bg-secondary/60 shadow-lg"
        animate={{ y: [15, -15, 15], rotate: [0, -10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-40 left-[25%] w-24 h-24 rounded-[2rem] bg-gradient-to-br from-primary/40 to-secondary/30 shadow-xl"
        animate={{ y: [-10, 20, -10], x: [-5, 10, -5] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-32 right-[15%] w-10 h-10 rounded-xl bg-primary/50"
        animate={{ y: [10, -20, 10], rotate: [0, 15, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Floating Stat Cards - Center Area */}
      <motion.div
        className="absolute top-[25%] left-1/2 -translate-x-1/2 hidden lg:block z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
      >
        <motion.div
          animate={{ y: [-8, 8, -8], x: [-3, 3, -3] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="px-4 py-3 rounded-2xl bg-card/90 backdrop-blur-xl border border-border/50 shadow-xl"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg. Engagement</p>
              <p className="text-lg font-bold text-foreground">+247%</p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Active Teams badge removed to fix overlap with background lines */}

      <motion.div
        className="absolute top-[55%] left-1/2 hidden lg:block z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.6 }}
      >
        <motion.div
          animate={{ y: [-6, 10, -6], x: [2, -4, 2] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
          className="px-4 py-3 rounded-2xl bg-card/90 backdrop-blur-xl border border-border/50 shadow-xl"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center shadow-lg">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Posts Created</p>
              <p className="text-lg font-bold text-foreground">1M+</p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Additional floating elements for visual balance */}
      <motion.div
        className="absolute top-[35%] right-[42%] hidden xl:flex items-center gap-2 px-3 py-2 rounded-full bg-accent/80 backdrop-blur-sm border border-primary/20 z-10"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.4, duration: 0.5 }}
      >
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        >
          <Target className="w-4 h-4 text-primary" />
        </motion.div>
        <span className="text-xs font-medium text-accent-foreground">Smart Targeting</span>
      </motion.div>

      <motion.div
        className="absolute bottom-[35%] left-[42%] hidden xl:flex items-center gap-2 px-3 py-2 rounded-full bg-accent/80 backdrop-blur-sm border border-primary/20 z-10"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.6, duration: 0.5 }}
      >
        <BarChart3 className="w-4 h-4 text-primary" />
        <span className="text-xs font-medium text-accent-foreground">Real-time Analytics</span>
      </motion.div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-20 pt-10 lg:py-20">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-20">
          {/* Left Content */}
          <motion.div
            className="flex-1 text-center lg:text-left"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            {/* Badge */}
            <motion.div
              className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full glass-card text-sm font-medium mb-8"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <div className="w-6 h-6 rounded-full gradient-bg flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              <span className="text-foreground">AI-Powered Content Platform</span>
              <Zap className="w-4 h-4 text-primary" />
            </motion.div>

            {/* Headline with Flipping Text */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight mb-8 min-h-[1.2em] overflow-hidden whitespace-nowrap">
              <AnimatePresence mode="wait">
                <motion.span
                  key={currentIndex}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -40 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="gradient-text block"
                >
                  {phrases[currentIndex]}
                </motion.span>
              </AnimatePresence>
            </h1>

            {/* Subheadline with Typewriter Effect */}
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 mb-10 leading-relaxed min-h-[3em]">
              {displayedText}
              {!isTypingComplete && (
                <motion.span
                  className="inline-block w-0.5 h-5 bg-primary ml-0.5 align-middle"
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
                />
              )}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <motion.a
                href="/signup"
                className="btn-primary w-full sm:w-auto text-base"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </motion.a>
              <motion.button
                className="btn-secondary w-full sm:w-auto text-base"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Play className="w-5 h-5" />
                Watch Demo
              </motion.button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center gap-6 mt-10 justify-center lg:justify-start text-sm text-muted-foreground">
              <span className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                  <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                No credit card required
              </span>
              <span className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                  <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                Free forever on Basic
              </span>
            </div>
          </motion.div>

          {/* Right Content - Dashboard Mockup */}
          <motion.div
            className="flex-1 w-full max-w-2xl"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
          >
            <div className="relative">
              {/* Glow Effect */}
              <div className="absolute -inset-6 bg-gradient-to-r from-primary/40 via-secondary/30 to-primary/40 rounded-[2.5rem] blur-3xl opacity-60" />

              {/* Dashboard Preview */}
              <div className="relative bg-card rounded-3xl shadow-2xl border border-white/20 overflow-hidden backdrop-blur-sm">
                {/* Browser Bar */}
                <div className="flex items-center gap-3 px-5 py-4 bg-muted/40 border-b border-border/50">
                  <div className="flex gap-2">
                    <div className="w-3.5 h-3.5 rounded-full bg-red-400" />
                    <div className="w-3.5 h-3.5 rounded-full bg-yellow-400" />
                    <div className="w-3.5 h-3.5 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="bg-background/80 rounded-xl px-4 py-2 text-sm text-muted-foreground max-w-[200px]">
                      app.virl.io
                    </div>
                  </div>
                </div>

                {/* Dashboard Content */}
                <div className="flex h-80">
                  {/* Sidebar */}
                  <div className="w-16 bg-foreground/[0.03] border-r border-border/50 p-3 flex flex-col gap-3">
                    <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center mx-auto shadow-lg">
                      <span className="text-primary-foreground font-bold text-sm">V</span>
                    </div>
                    <div className="flex-1 flex flex-col gap-2.5 mt-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className={`w-10 h-10 rounded-xl ${i === 1 ? 'bg-primary/20 border border-primary/30' : 'bg-muted/80'} mx-auto transition-all hover:scale-105`} />
                      ))}
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 p-5">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-11 h-11 rounded-xl gradient-bg flex items-center justify-center shadow-lg">
                        <Sparkles className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">Vixi AI</div>
                        <div className="text-xs text-muted-foreground">Your content strategist</div>
                      </div>
                    </div>

                    {/* Chat Messages */}
                    <div className="space-y-3.5">
                      <div className="bg-muted/60 rounded-2xl rounded-bl-md p-4 max-w-[80%]">
                        <p className="text-sm">I need viral content ideas for a productivity app launch</p>
                      </div>
                      <div className="bg-gradient-to-br from-primary/15 to-secondary/10 rounded-2xl rounded-br-md p-4 max-w-[80%] ml-auto border border-primary/20">
                        <p className="text-sm">🎯 Here are 5 viral-worthy hooks for your launch:</p>
                        <ul className="text-sm mt-2.5 space-y-1.5 text-muted-foreground">
                          <li className="flex items-start gap-2">
                            <span className="text-primary">•</span>
                            "I tried every productivity app..."
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-primary">•</span>
                            "The 2-minute rule changed my life"
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-primary">•</span>
                            "Why 90% of to-do lists fail"
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

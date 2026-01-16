"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
const dashboardImg = "/assets/showcase-dashboard.png";
const vixiImg = "/assets/showcase-vixi.png";
const kanbanImg = "/assets/showcase-kanban.png";

// FAST animation - 10 seconds total
const TOTAL_DURATION = 10;

// Arrow SVG - larger and more vivid
const Arrow = () => (
  <svg width="42" height="42" viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="arrowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#7C3AED" />
        <stop offset="100%" stopColor="#4F46E5" />
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
        <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>
    <path
      d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.48 0 .72-.58.38-.92L6.35 2.84c-.34-.34-.85-.11-.85.37Z"
      fill="url(#arrowGrad)"
      stroke="#fff"
      strokeWidth="1.5"
      filter="url(#glow)"
    />
  </svg>
);

const ProductShowcase = () => {
  const [time, setTime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime((prev) => (prev >= TOTAL_DURATION ? 0 : prev + 0.025));
    }, 25);
    return () => clearInterval(interval);
  }, []);

  // Fast phases - 3s each
  const phase = time < 3 ? "dashboard" : time < 6.5 ? "vixi" : "kanban";

  // Vixi typing - faster
  const words = ["Generate", "viral", "hooks", "for", "Air", "Max", "campaign..."];
  const vixiTime = time - 3;
  const wordsVisible = phase === "vixi" ? Math.min(Math.floor((vixiTime - 0.3) / 0.35), words.length) : 0;

  // Kanban drag - faster
  const kanbanTime = time - 6.5;
  const dragProgress = phase === "kanban" ? Math.max(0, Math.min((kanbanTime - 0.5) / 1.8, 1)) : 0;

  // Card click animation
  const dashboardClickTime = time >= 1.2 && time < 2.2 ? (time - 1.2) / 1 : 0;

  // Arrow position - INSTANT, no lag
  const getArrowPos = () => {
    // === DASHBOARD (0 - 3s) ===
    if (time < 0.3) {
      const t = time / 0.3;
      return { left: -5 + t * 27, top: 20 + t * 50 };
    }
    if (time < 1.2) {
      return { left: 22, top: 70 };
    }
    if (time < 2.2) {
      // Click bounce
      return { left: 22, top: 70 + Math.sin((time - 1.2) * 12) * 3 };
    }
    if (time < 3) {
      const t = (time - 2.2) / 0.8;
      return { left: 22 + t * 30, top: 70 - t * 30 };
    }

    // === VIXI (3 - 6.5s) ===
    if (time < 3.3) {
      const t = (time - 3) / 0.3;
      return { left: 10 + t * 8, top: 50 + t * 38 };
    }
    if (time < 5.8) {
      // Follow typing instantly
      const t = (time - 3.3) / 2.5;
      return { left: 18 + t * 52, top: 88 };
    }
    if (time < 6.5) {
      return { left: 70, top: 88 };
    }

    // === KANBAN (6.5 - 10s) ===
    if (time < 7) {
      const t = (time - 6.5) / 0.5;
      return { left: 5 + t * 8, top: 30 + t * 18 };
    }
    if (time < 9) {
      // DRAG - arrow moves WITH card
      return {
        left: 13 + dragProgress * 70,
        top: 48 - dragProgress * 18
      };
    }
    return { left: 83, top: 30 };
  };

  const arrowPos = getArrowPos();

  return (
    <section className="py-24 relative overflow-hidden bg-gradient-to-b from-background via-muted/30 to-background">
      {/* Enhanced ambient effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/8 via-transparent to-transparent" />
      <motion.div
        className="absolute top-20 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl"
        animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 6, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-20 right-1/4 w-80 h-80 rounded-full bg-purple-500/5 blur-3xl"
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.4, 0.2, 0.4] }}
        transition={{ duration: 5, repeat: Infinity }}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with enhanced animation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.span
            className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 border border-primary/20"
            animate={{ boxShadow: ["0 0 0 0 rgba(124, 58, 237, 0)", "0 0 20px 5px rgba(124, 58, 237, 0.15)", "0 0 0 0 rgba(124, 58, 237, 0)"] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            ✨ See It In Action
          </motion.span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            From Idea to <span className="gradient-text">Viral Content</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Watch the complete journey in one seamless flow
          </p>
        </motion.div>

        {/* Phase Indicators - enhanced */}
        <div className="flex justify-center gap-4 mb-8">
          {["Dashboard", "Vixi AI", "Kanban"].map((label, i) => {
            const isActive = (i === 0 && phase === "dashboard") ||
              (i === 1 && phase === "vixi") ||
              (i === 2 && phase === "kanban");
            return (
              <motion.div
                key={label}
                animate={isActive ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 0.5 }}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${isActive
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 border border-primary/50"
                  : "bg-muted/50 text-muted-foreground border border-border/50"
                  }`}
              >
                {label}
              </motion.div>
            );
          })}
        </div>

        {/* Progress bar - smoother */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden shadow-inner">
            <motion.div
              className="h-full bg-gradient-to-r from-primary via-purple-500 to-indigo-500"
              style={{ width: `${(time / TOTAL_DURATION) * 100}%` }}
            />
          </div>
        </div>

        {/* Showcase container */}
        <div className="relative max-w-6xl mx-auto">
          <motion.div
            className="relative rounded-2xl overflow-hidden shadow-2xl shadow-primary/15 border border-border/50 bg-card"
            whileHover={{ boxShadow: "0 25px 50px -12px rgba(124, 58, 237, 0.25)" }}
            transition={{ duration: 0.3 }}
          >
            {/* Browser Chrome */}
            <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b border-border/50 backdrop-blur-sm">
              <div className="flex gap-2">
                <motion.div className="w-3 h-3 rounded-full bg-red-400" whileHover={{ scale: 1.2 }} />
                <motion.div className="w-3 h-3 rounded-full bg-yellow-400" whileHover={{ scale: 1.2 }} />
                <motion.div className="w-3 h-3 rounded-full bg-green-400" whileHover={{ scale: 1.2 }} />
              </div>
              <div className="flex-1 mx-4">
                <div className="bg-background/60 rounded-md px-4 py-1.5 text-xs text-muted-foreground text-center backdrop-blur-sm border border-border/30">
                  app.virl.in
                </div>
              </div>
            </div>

            {/* Stage */}
            <div className="relative aspect-[16/9] overflow-hidden bg-slate-900">

              {/* === DASHBOARD === */}
              <AnimatePresence>
                {phase === "dashboard" && (
                  <motion.div
                    key="dashboard"
                    className="absolute inset-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 1.4, filter: "blur(20px)" }}
                    transition={{ duration: 0.25 }}
                  >
                    <motion.div
                      className="absolute inset-0"
                      animate={{
                        scale: time > 2.2 ? 1 + (time - 2.2) * 0.3 : 1,
                        x: time > 2.2 ? -(time - 2.2) * 40 : 0,
                        y: time > 2.2 ? (time - 2.2) * 50 : 0,
                      }}
                    >
                      <img src={dashboardImg} alt="Dashboard" className="w-full h-full object-cover object-top" />

                      {/* Image quality overlay - subtle grain */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent pointer-events-none" />
                    </motion.div>

                    {/* Floating particles */}
                    {[...Array(6)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-1 h-1 rounded-full bg-primary/40"
                        style={{ left: `${20 + i * 12}%`, top: `${30 + (i % 3) * 20}%` }}
                        animate={{ y: [-10, 10, -10], opacity: [0.3, 0.7, 0.3] }}
                        transition={{ duration: 2 + i * 0.3, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}

                    {/* Air Max Card - CLICK ANIMATION with glow */}
                    <motion.div
                      className="absolute rounded-xl pointer-events-none"
                      style={{ top: "55%", left: "18%", width: "23%", height: "32%" }}
                      animate={{
                        scale: dashboardClickTime > 0 ? 1 + Math.sin(dashboardClickTime * Math.PI) * 0.08 : 1,
                        boxShadow: dashboardClickTime > 0
                          ? `0 0 ${40 + dashboardClickTime * 40}px ${15 + dashboardClickTime * 20}px rgba(124, 58, 237, ${0.4 + dashboardClickTime * 0.4})`
                          : time >= 0.3 && time < 1.2
                            ? "0 0 25px 8px rgba(124, 58, 237, 0.35)"
                            : "0 0 0 0 transparent",
                      }}
                    />

                    {/* Click ripples */}
                    {time >= 1.4 && time < 2.4 && (
                      <div className="absolute pointer-events-none" style={{ top: "70%", left: "28%" }}>
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            className="absolute rounded-full border-2 border-primary/70"
                            style={{ transform: "translate(-50%, -50%)" }}
                            initial={{ width: 0, height: 0, opacity: 0.8 }}
                            animate={{ width: 100 + i * 40, height: 100 + i * 40, opacity: 0 }}
                            transition={{ duration: 0.4, delay: i * 0.08 }}
                          />
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* === VIXI === */}
              <AnimatePresence>
                {phase === "vixi" && (
                  <motion.div
                    key="vixi"
                    className="absolute inset-0"
                    initial={{ opacity: 0, scale: 1.4 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.25 }}
                  >
                    <img src={vixiImg} alt="Vixi" className="w-full h-full object-cover object-top" />

                    {/* Quality overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/5 pointer-events-none" />

                    {/* Floating sparkles */}
                    {[...Array(8)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-1.5 h-1.5 rounded-full"
                        style={{
                          left: `${15 + i * 10}%`,
                          top: `${20 + (i % 4) * 15}%`,
                          background: i % 2 === 0 ? "#7C3AED" : "#FFD700"
                        }}
                        animate={{
                          scale: [0.5, 1, 0.5],
                          opacity: [0.3, 0.8, 0.3],
                          y: [-5, 5, -5]
                        }}
                        transition={{ duration: 1.5 + i * 0.2, repeat: Infinity, delay: i * 0.1 }}
                      />
                    ))}

                    {/* Input with typing */}
                    <motion.div
                      className="absolute left-[5%] right-[5%] bottom-[4%]"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="bg-card/95 backdrop-blur-md rounded-xl px-4 py-3 border border-primary/30 shadow-2xl shadow-primary/20">
                        <div className="flex items-center gap-3">
                          <motion.div
                            className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center text-lg flex-shrink-0 border border-primary/30"
                            animate={{ rotate: [0, 5, -5, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            😊
                          </motion.div>
                          <div className="flex-1">
                            <div className="text-foreground text-sm md:text-base font-medium flex flex-wrap gap-1">
                              {words.slice(0, Math.max(0, wordsVisible)).map((word, i) => (
                                <motion.span
                                  key={i}
                                  initial={{ opacity: 0, scale: 0.8, y: 5 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  className={i === wordsVisible - 1 ? "text-primary font-bold" : ""}
                                >
                                  {word}
                                </motion.span>
                              ))}
                              <motion.span
                                className="text-primary font-bold"
                                animate={{ opacity: [1, 0] }}
                                transition={{ duration: 0.3, repeat: Infinity }}
                              >|</motion.span>
                            </div>
                          </div>
                          <motion.div
                            className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/30"
                            animate={time >= 5.8 ? { scale: [1, 1.3, 1] } : {}}
                            transition={{ duration: 0.2 }}
                            whileHover={{ scale: 1.1 }}
                          >
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                            </svg>
                          </motion.div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Send burst sparkles */}
                    {time >= 5.9 && time < 6.5 && (
                      <div className="absolute pointer-events-none" style={{ bottom: "10%", right: "7%" }}>
                        {[...Array(20)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="absolute w-2 h-2 rounded-full"
                            style={{ background: ["#7C3AED", "#FFD700", "#4F46E5", "#22C55E"][i % 4] }}
                            initial={{ scale: 0, x: 0, y: 0 }}
                            animate={{
                              scale: [0, 1.5, 0],
                              x: (Math.random() - 0.5) * 150,
                              y: (Math.random() - 0.5) * 150,
                            }}
                            transition={{ duration: 0.4, delay: i * 0.015 }}
                          />
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* === KANBAN === */}
              <AnimatePresence>
                {phase === "kanban" && (
                  <motion.div
                    key="kanban"
                    className="absolute inset-0"
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <img src={kanbanImg} alt="Kanban" className="w-full h-full object-cover object-left-top" />

                    {/* Quality overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/5 via-transparent to-transparent pointer-events-none" />

                    {/* Shimmer on first card */}
                    <motion.div
                      className="absolute overflow-hidden rounded-xl pointer-events-none"
                      style={{ top: "17%", left: "4.5%", width: "12%", height: "24%" }}
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-12"
                        style={{ width: "50%" }}
                        animate={{ x: ["-100%", "400%"] }}
                        transition={{ duration: 1, repeat: Infinity, repeatDelay: 1.5 }}
                      />
                    </motion.div>

                    {/* DRAGGED CARD */}
                    {kanbanTime >= 0.5 && (
                      <motion.div
                        className="absolute rounded-xl shadow-2xl overflow-hidden z-10 pointer-events-none"
                        style={{
                          width: "11%",
                          height: "14%",
                          background: "linear-gradient(135deg, #8B5CF6, #7C3AED)",
                          left: `${7 + dragProgress * 76}%`,
                          top: `${42 - dragProgress * 12}%`,
                          transform: `rotate(${3 - dragProgress * 3}deg) scale(${1.08 + (1 - dragProgress) * 0.04})`,
                          boxShadow: `0 20px 40px -10px rgba(124, 58, 237, 0.5)`,
                        }}
                      >
                        <div className="p-2.5 text-white h-full flex flex-col justify-center">
                          <p className="font-bold text-[11px] leading-tight">Lock Down Global</p>
                          <p className="text-[9px] opacity-80 mt-0.5">Parkour Athletes</p>
                        </div>

                        {/* Card glow trail */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"
                          animate={{ opacity: [0.3, 0.6, 0.3] }}
                          transition={{ duration: 0.5, repeat: Infinity }}
                        />
                      </motion.div>
                    )}

                    {/* Drop zone glow */}
                    {dragProgress > 0.4 && (
                      <motion.div
                        className="absolute rounded-xl border-2 border-dashed border-green-500/80 bg-green-500/15 pointer-events-none"
                        style={{ top: "8%", right: "1%", width: "11%", height: "85%" }}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.15 }}
                      />
                    )}

                    {/* Success celebration when dropped */}
                    {dragProgress >= 0.98 && (
                      <div className="absolute pointer-events-none" style={{ top: "30%", right: "6%" }}>
                        {[...Array(12)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="absolute w-2 h-2 rounded-full"
                            style={{ background: ["#22C55E", "#7C3AED", "#FFD700"][i % 3] }}
                            initial={{ scale: 0, x: 0, y: 0 }}
                            animate={{
                              scale: [0, 1.2, 0],
                              x: (Math.random() - 0.5) * 80,
                              y: (Math.random() - 0.5) * 80,
                            }}
                            transition={{ duration: 0.5, delay: i * 0.02 }}
                          />
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* === ARROW - INSTANT, no lag === */}
              <motion.div
                className="absolute z-50 pointer-events-none"
                animate={{
                  left: `${arrowPos.left}%`,
                  top: `${arrowPos.top}%`,
                }}
                transition={{ duration: 0.02, ease: "linear" }}
              >
                <motion.div
                  animate={{
                    filter: [
                      "drop-shadow(0 0 8px rgba(124, 58, 237, 0.6))",
                      "drop-shadow(0 0 18px rgba(124, 58, 237, 1))",
                      "drop-shadow(0 0 8px rgba(124, 58, 237, 0.6))",
                    ],
                  }}
                  transition={{ duration: 0.6, repeat: Infinity }}
                >
                  <Arrow />
                </motion.div>
              </motion.div>
            </div>
          </motion.div>

          {/* Ambient glows */}
          <motion.div
            className="absolute -top-10 -right-10 w-52 h-52 rounded-full bg-gradient-to-br from-primary/30 to-purple-500/20 blur-3xl -z-10"
            animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          <motion.div
            className="absolute -bottom-10 -left-10 w-44 h-44 rounded-full bg-gradient-to-tr from-indigo-500/20 to-primary/25 blur-3xl -z-10"
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.4, 0.25, 0.4] }}
            transition={{ duration: 5, repeat: Infinity }}
          />
        </div>

        {/* Descriptions with enhanced styling */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            { title: "Discover", desc: "Click projects to dive deeper", icon: "🎯", active: phase === "dashboard" },
            { title: "Create", desc: "Vixi generates viral content", icon: "✨", active: phase === "vixi" },
            { title: "Execute", desc: "Drag tasks to done", icon: "🚀", active: phase === "kanban" },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.02, y: -2 }}
              className={`text-center p-6 rounded-2xl transition-all duration-300 border ${item.active
                ? "bg-primary/10 border-primary/40 scale-105 shadow-lg shadow-primary/10"
                : "bg-muted/30 border-border/50 hover:border-primary/20"
                }`}
            >
              <motion.div
                className="text-4xl mb-4"
                animate={item.active ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.5 }}
              >
                {item.icon}
              </motion.div>
              <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
              <p className="text-muted-foreground text-sm">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductShowcase;

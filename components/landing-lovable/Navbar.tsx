"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: "Features", href: "#features" },
    { name: "Teams", href: "#teams" },
    { name: "Pricing", href: "#pricing" },
    { name: "FAQ", href: "#faq" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className="mx-4 mt-4">
        <div className="glass rounded-2xl px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <a href="/" className="flex items-center">
              <img src="/assets/virl-logo.png" alt="Virl" className="h-8 sm:h-9 w-auto" />
            </a>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="px-4 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 font-medium transition-all duration-200"
                >
                  {link.name}
                </a>
              ))}
            </div>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-3">
              <a href="/login" className="px-4 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 font-medium transition-all duration-200">
                Log in
              </a>
              <a href="/signup" className="btn-primary text-sm py-2.5 px-5">
                Start Free Trial
              </a>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-xl text-foreground hover:bg-muted/50 transition-colors"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div >
        </div >
      </div >

      {/* Mobile Menu */}
      <AnimatePresence>
        {
          isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="md:hidden mx-4 mt-2"
            >
              <div className="glass rounded-2xl p-4 flex flex-col gap-2">
                {navLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    className="text-foreground font-medium py-3 px-4 rounded-xl hover:bg-muted/50 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    {link.name}
                  </a>
                ))}
                <hr className="border-border/50 my-2" />
                <a href="/login" className="text-muted-foreground font-medium py-3 px-4 rounded-xl hover:bg-muted/50 transition-colors">
                  Log in
                </a>
                <a href="/signup" className="btn-primary text-center mt-2">
                  Start Free Trial
                </a>
              </div>
            </motion.div>
          )
        }
      </AnimatePresence >
    </nav >
  );
};

export default Navbar;

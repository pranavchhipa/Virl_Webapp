"use client";

import { Twitter, Linkedin, Mail, MapPin, Phone, Clock, Instagram } from "lucide-react";
import { toast } from "sonner";

const footerLinks = {
  Product: [
    { name: "Features", href: "/#features" },
    { name: "Pricing", href: "/#pricing" },
    { name: "Changelog", href: "#" },
  ],
  Company: [
    { name: "About", href: "#" },
    { name: "Team", href: "/team" },
    { name: "Blog", href: "#" },
    { name: "Contact Us", href: "/contact" },
  ],
  Legal: [
    { name: "Privacy Policy", href: "/privacy-policy" },
    { name: "Terms of Service", href: "/terms-of-service" },
    { name: "Refund Policy", href: "/refund-policy" },
    { name: "Shipping Policy", href: "/shipping-policy" },
  ],
};

const socialLinks = [
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
  { icon: Mail, href: "mailto:hello@virl.in", label: "Email" },
];

const Footer = () => {
  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string, name: string) => {
    if (href === "#") {
      e.preventDefault();
      if (name === "About") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  return (
    <footer className="py-20 border-t border-border/50 bg-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 lg:gap-16">
          {/* Brand & Address */}
          <div className="col-span-2">
            <a href="/" className="flex items-center mb-6">
              <img src="/assets/virl-logo.png" alt="Virl" className="h-10 w-auto" />
            </a>
            <p className="text-muted-foreground mb-6 max-w-xs leading-relaxed">
              The AI-powered workspace where content teams collaborate, create, and launch viral campaigns.
            </p>

            {/* India Office */}
            <div className="mb-6">
              <h5 className="font-semibold text-sm mb-3 text-foreground">India Office</h5>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="font-medium text-foreground/80">ISOMETRICA EXPERIENCES PVT LTD</p>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>B-23, Sector 63, Noida - 201301</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  <a href="tel:+918527004337" className="hover:text-primary transition-colors">+91 85270 04337</a>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  <span>10:00 - 20:00 IST</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <a href="mailto:hello@virl.in" className="hover:text-primary transition-colors">hello@virl.in</a>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  onClick={(e) => handleLinkClick(e, social.href, social.label)}
                  className="w-11 h-11 rounded-xl bg-card border border-border/50 hover:border-primary/30 hover:bg-primary/5 flex items-center justify-center transition-all"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5 text-muted-foreground" />
                </a>
              ))}
            </div>
          </div >

          {/* Links */}
          {
            Object.entries(footerLinks).map(([category, links]) => (
              <div key={category}>
                <h4 className="font-semibold mb-5 text-lg">{category}</h4>
                <ul className="space-y-4">
                  {links.map((link) => (
                    <li key={link.name}>
                      <a
                        href={link.href}
                        onClick={(e) => handleLinkClick(e, link.href, link.name)}
                        className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      >
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          }
        </div >

        <div className="mt-16 pt-8 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Copyright 2026, virl.in, A product by Isometrica Experiences Pvt Ltd
          </p>
          <p className="text-sm text-muted-foreground">
            Made with ❤️ for content creators
          </p>
        </div>
      </div >
    </footer >
  );
};

export default Footer;

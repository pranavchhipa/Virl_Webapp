"use client";

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    quote: "Virl cut our revision cycles in half. Clients love the review portal.",
    author: "Sarah M.",
    role: "Social Media Manager at GrowthCo",
    avatar: "S",
  },
  {
    quote: "Vixi is like having an extra team member who never runs out of ideas.",
    author: "Raj K.",
    role: "Founder, CreativeEdge Agency",
    avatar: "R",
  },
  {
    quote: "Finally, one place for everything. No more Slack + Dropbox + Email chaos.",
    author: "Priya S.",
    role: "Content Lead at StartupHub",
    avatar: "P",
  },
];

const Testimonials = () => {
  return (
    <section className="section-padding">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <motion.span
            className="inline-block px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            Testimonials
          </motion.span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
            Loved by <span className="gradient-text">content teams</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.author}
              className="relative p-8 lg:p-10 rounded-3xl bg-card border border-border/50 card-hover"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Quote className="absolute top-6 right-6 w-10 h-10 text-primary/10" />

              {/* Stars */}
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-lg mb-8 leading-relaxed">"{testimonial.quote}"</p>

              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl gradient-bg flex items-center justify-center shadow-lg">
                  <span className="text-primary-foreground font-bold text-lg">{testimonial.avatar}</span>
                </div>
                <div>
                  <div className="font-semibold text-lg">{testimonial.author}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;

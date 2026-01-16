"use client";

import { motion } from "framer-motion";
import { Bot, MessageSquare, FolderOpen, LayoutGrid, Users, BarChart3 } from "lucide-react";

const features = [
  {
    icon: Bot,
    title: "Vixi AI Assistant",
    description: "Generate viral content ideas in seconds. Our AI understands trends and creates platform-specific strategies.",
    color: "from-violet-500 to-purple-600",
  },
  {
    icon: MessageSquare,
    title: "Client Review Portal",
    description: "Clients review and approve content with timestamped comments. No more scattered feedback.",
    color: "from-blue-500 to-indigo-600",
  },
  {
    icon: FolderOpen,
    title: "Asset Management",
    description: "Upload, organize, and access all your media in one place. Never lose a file again.",
    color: "from-emerald-500 to-teal-600",
  },
  {
    icon: LayoutGrid,
    title: "Kanban Workflow",
    description: "Visualize your content pipeline from ideation to published. Stay on track.",
    color: "from-orange-500 to-amber-600",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Invite your team, assign roles, and work together seamlessly.",
    color: "from-pink-500 to-rose-600",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Track what's working and optimize your content strategy.",
    color: "from-cyan-500 to-blue-600",
  },
];

const Features = () => {
  return (
    <section id="features" className="section-padding relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10 bg-muted/30" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-primary/5 to-transparent rounded-full blur-3xl -z-10" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <motion.span
            className="inline-block px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            Features
          </motion.span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            One platform.{" "}
            <span className="gradient-text">Everything you need.</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Streamline your content workflow with powerful tools designed for modern content teams.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="group p-8 rounded-3xl bg-card border border-border/50 card-hover relative overflow-hidden"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              {/* Hover gradient overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500`} />

              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 shadow-lg`}>
                <feature.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;

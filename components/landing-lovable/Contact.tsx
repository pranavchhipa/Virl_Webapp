"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import Navbar from "@/components/landing-lovable/Navbar";
import Footer from "@/components/landing-lovable/Footer";
import { Button } from "@/components/landing-lovable/ui/button";
import { Input } from "@/components/landing-lovable/ui/input";
import { Textarea } from "@/components/landing-lovable/ui/textarea";
import { toast } from "sonner";
import { submitContactForm } from "@/app/actions/contact";
import { Loader2 } from "lucide-react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";

const contactInfo = [
    {
        icon: Mail,
        title: "Email",
        details: "hello@virl.in",
        href: "mailto:hello@virl.in",
    },
    {
        icon: Phone,
        title: "Phone",
        details: "+91 85270 04337",
        href: "tel:+918527004337",
    },
    {
        icon: MapPin,
        title: "India Office",
        details: "ISOMETRICA EXPERIENCES PVT LTD\nB-23, Sector 63, Noida - 201301",
        href: "https://maps.google.com/?q=B-23,+Sector+63,+Noida+-+201301",
    },
];

const Contact = () => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        message: "",
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
    const turnstileRef = useRef<TurnstileInstance>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!turnstileToken) {
            toast.error("Please complete the security verification.");
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await submitContactForm({ ...formData, turnstileToken });

            if (result.success) {
                toast.success("Message sent! We'll get back to you as soon as possible.");
                setFormData({ name: "", email: "", subject: "", message: "" });
                setTurnstileToken(null);
                turnstileRef.current?.reset();
            } else {
                toast.error(result.error || "Failed to send message.");
                // Reset Turnstile on error so user can try again
                turnstileRef.current?.reset();
                setTurnstileToken(null);
            }
        } catch (error) {
            toast.error("Something went wrong. Please try again.");
            turnstileRef.current?.reset();
            setTurnstileToken(null);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="pt-32 pb-20">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        className="text-center mb-16"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
                            Get in <span className="gradient-text">Touch</span>
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Have questions about Virl? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
                        </p>
                    </motion.div>

                    <div className="grid lg:grid-cols-2 gap-16 max-w-6xl mx-auto">
                        {/* Contact Form */}
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2, duration: 0.6 }}
                        >
                            <div className="bg-card border border-border/50 rounded-3xl p-8 lg:p-10">
                                <h2 className="text-2xl font-semibold mb-6">Send us a message</h2>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="name" className="block text-sm font-medium mb-2">
                                                Name
                                            </label>
                                            <Input
                                                id="name"
                                                name="name"
                                                placeholder="Your name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                required
                                                className="rounded-xl"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="email" className="block text-sm font-medium mb-2">
                                                Email
                                            </label>
                                            <Input
                                                id="email"
                                                name="email"
                                                type="email"
                                                placeholder="you@example.com"
                                                value={formData.email}
                                                onChange={handleChange}
                                                required
                                                className="rounded-xl"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="subject" className="block text-sm font-medium mb-2">
                                            Subject
                                        </label>
                                        <Input
                                            id="subject"
                                            name="subject"
                                            placeholder="How can we help?"
                                            value={formData.subject}
                                            onChange={handleChange}
                                            required
                                            className="rounded-xl"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="message" className="block text-sm font-medium mb-2">
                                            Message
                                        </label>
                                        <Textarea
                                            id="message"
                                            name="message"
                                            placeholder="Tell us more about your inquiry..."
                                            value={formData.message}
                                            onChange={handleChange}
                                            required
                                            rows={5}
                                            className="rounded-xl resize-none"
                                        />
                                    </div>

                                    {/* Cloudflare Turnstile Bot Protection */}
                                    <div className="flex justify-center">
                                        <Turnstile
                                            ref={turnstileRef}
                                            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                                            onSuccess={(token) => setTurnstileToken(token)}
                                            onError={() => {
                                                toast.error("Security verification failed. Please try again.");
                                                setTurnstileToken(null);
                                            }}
                                            onExpire={() => setTurnstileToken(null)}
                                            options={{
                                                theme: 'light',
                                            }}
                                        />
                                    </div>

                                    <Button type="submit" className="w-full btn-primary rounded-xl py-6" disabled={isSubmitting || !turnstileToken}>
                                        {isSubmitting ? (
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        ) : (
                                            <Send className="w-4 h-4 mr-2" />
                                        )}
                                        {isSubmitting ? "Sending..." : "Send Message"}
                                    </Button>
                                </form>
                            </div>
                        </motion.div>

                        {/* Contact Info */}
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3, duration: 0.6 }}
                            className="space-y-8"
                        >
                            <div>
                                <h2 className="text-2xl font-semibold mb-6">Contact Information</h2>
                                <p className="text-muted-foreground mb-8">
                                    Reach out to us through any of the following channels. Our team is available 10:00 AM to 8:00 PM IST.
                                </p>
                            </div>

                            <div className="space-y-6">
                                {contactInfo.map((info, index) => (
                                    <motion.a
                                        key={info.title}
                                        href={info.href}
                                        className="flex items-start gap-4 p-6 bg-card border border-border/50 rounded-2xl hover:border-primary/30 transition-all group"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                                            <info.icon className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold mb-1">{info.title}</h3>
                                            <p className="text-muted-foreground whitespace-pre-line">{info.details}</p>
                                        </div>
                                    </motion.a>
                                ))}
                            </div>

                            <div className="p-6 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl border border-primary/20">
                                <h3 className="font-semibold mb-2">Need immediate help?</h3>
                                <p className="text-muted-foreground text-sm">
                                    For urgent inquiries, please email us directly at{" "}
                                    <a href="mailto:hello@virl.in" className="text-primary hover:underline">
                                        hello@virl.in
                                    </a>{" "}
                                    and we'll prioritize your request.
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Contact;

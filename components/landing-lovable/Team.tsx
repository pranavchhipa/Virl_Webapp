"use client";

import Navbar from "@/components/landing-lovable/Navbar";
import Footer from "@/components/landing-lovable/Footer";
import { Heart } from "lucide-react";

const Team = () => {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />

            {/* Hero Section */}
            <main className="pt-32 pb-20">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-6xl mx-auto">
                        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                            {/* Founder Image */}
                            <div className="relative">
                                <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-border/30">
                                    <img
                                        src="/assets/founder-pranav.jpg"
                                        alt="Pranav - Founder of Virl"
                                        className="w-full h-auto object-cover aspect-[3/4]"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                                </div>
                                {/* Decorative elements */}
                                <div className="absolute -z-10 -top-6 -left-6 w-full h-full rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 blur-sm" />
                                <div className="absolute -z-10 -bottom-4 -right-4 w-32 h-32 rounded-full bg-primary/10 blur-2xl" />
                            </div>

                            {/* Story Content */}
                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                                        Built by Creators,
                                        <span className="block bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                                            For Creators.
                                        </span>
                                    </h1>
                                    <p className="text-xl md:text-2xl text-muted-foreground font-medium">
                                        From Chaos to Clarity.
                                    </p>
                                </div>

                                <div className="space-y-6 text-muted-foreground leading-relaxed text-lg">
                                    <p>
                                        "We didn't just build Virl; we lived the problem. As a social media team ourselves,
                                        we were drowning in scattered files, endless feedback loops, and chaotic collaboration.
                                        We knew there had to be a better way.
                                    </p>
                                    <p>
                                        So, we built Virl—a unified system designed to take you from raw ideation to final
                                        post effortlessly. Our mission was simple: make professional-grade collaboration
                                        efficient and economically accessible for every creator.
                                    </p>
                                    <p>
                                        This platform is our love letter to the creator economy. We built it to solve our
                                        pain, and now we're growing it to solve yours. We're listening, we're iterating,
                                        and we're building this with you."
                                    </p>
                                </div>

                                {/* Founder Tag */}
                                <div className="pt-4 border-t border-border/50">
                                    <p className="text-lg font-semibold text-foreground">Pranav & Team</p>
                                    <p className="text-sm text-muted-foreground">Founders of Virl</p>
                                </div>

                                {/* Tagline */}
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <span>Made with</span>
                                    <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                                    <span>for Content Creators & Social Media Managers.</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Team;

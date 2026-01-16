import Navbar from "@/components/landing-lovable/Navbar";
import Footer from "@/components/landing-lovable/Footer";

const ShippingPolicy = () => {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="pt-32 pb-20">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
                    <h1 className="text-4xl sm:text-5xl font-bold mb-8 gradient-text">Shipping & Delivery Policy</h1>
                    <p className="text-muted-foreground mb-12">Last Updated: January 17, 2026</p>

                    <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
                        <section>
                            <h2 className="text-2xl font-semibold mb-4">Digital Product - No Physical Shipping</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                Virl is a <strong>Software-as-a-Service (SaaS)</strong> platform that is delivered entirely online. As a digital product, there are <strong>no physical goods to ship</strong>.
                            </p>
                            <p className="text-muted-foreground leading-relaxed mt-4">
                                Upon successful payment and subscription activation, you will receive immediate access to the Virl platform. No waiting, no shipping delays – start creating viral content right away.
                            </p>
                        </section>

                        <section className="bg-primary/5 border border-primary/10 rounded-2xl p-6">
                            <h2 className="text-2xl font-semibold mb-4">Instant Digital Delivery</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                Your subscription to Virl is activated <strong>instantly</strong> after payment confirmation. You can start using all features of your chosen plan immediately.
                            </p>
                            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-4">
                                <li>No physical shipment required</li>
                                <li>Access granted within seconds of payment</li>
                                <li>Login credentials sent to your registered email</li>
                                <li>24/7 access from any device with internet connection</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4">Service Availability</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                Virl is available globally. As long as you have an internet connection, you can access our platform from anywhere in the world. We maintain 99.9% uptime to ensure your workflow is never interrupted.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4">Delivery Timeframe</h2>
                            <div className="bg-muted/50 rounded-2xl p-6 space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                                        <span className="text-2xl">⚡</span>
                                    </div>
                                    <div>
                                        <h3 className="font-medium">Instant Activation</h3>
                                        <p className="text-sm text-muted-foreground">Access granted immediately upon successful payment</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4">Access Issues?</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                If you have completed payment but are unable to access your Virl account, please contact us immediately:
                            </p>
                            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-4">
                                <li>
                                    Email: <a href="mailto:hello@virl.in" className="text-primary hover:underline">hello@virl.in</a>
                                </li>
                                <li>
                                    Phone: <a href="tel:+918527004337" className="text-primary hover:underline">+91 85270 04337</a>
                                </li>
                            </ul>
                            <p className="text-muted-foreground leading-relaxed mt-4">
                                Our support team is available Monday to Saturday, 10:00 AM - 8:00 PM IST, and will resolve any access issues within 24 hours.
                            </p>
                        </section>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default ShippingPolicy;

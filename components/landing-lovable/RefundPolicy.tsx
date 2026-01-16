import Navbar from "@/components/landing-lovable/Navbar";
import Footer from "@/components/landing-lovable/Footer";

const RefundPolicy = () => {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="pt-32 pb-20">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
                    <h1 className="text-4xl sm:text-5xl font-bold mb-8 gradient-text">Refund Policy</h1>
                    <p className="text-muted-foreground mb-12">Last Updated: January 15, 2026</p>

                    <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
                        <section>
                            <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                We provide a free trial period of our offering "Virl" to let you fully evaluate it before you make the decision to purchase the full version. Please use the trial period to ensure our product meets your needs before purchasing a license.
                            </p>
                            <p className="text-muted-foreground leading-relaxed mt-4">
                                Our support team is standing by to answer all your questions about Virl. Please test the product's features and functionalities, and coordinate with our support team to clarify your doubts before making a final purchase.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4">Trial Period and Decision to Purchase</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                The <strong>14-day</strong> trial period of Virl that we offer should be considered a "free look period". During this time, we encourage you to use Virl, test it, and decide if you would like to purchase the full version.
                            </p>
                            <p className="text-muted-foreground leading-relaxed mt-4">
                                After the 14 days are up, you will no longer be able to use Virl's trial version without subscribing to a paid plan.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4">Purchase, Cancellations and Refunds</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                Once you purchase and subscribe for the full version of Virl (whether monthly or yearly), your license to use it will be activated after your payment has cleared. Once the license is activated, you may cancel your subscription which will remain active for the remaining period of the subscription.
                            </p>

                            <div className="bg-muted/50 rounded-2xl p-6 mt-6 space-y-4">
                                <h3 className="text-lg font-medium">Example: Yearly Subscription</h3>
                                <p className="text-muted-foreground text-sm">
                                    If you have purchased a yearly subscription on 1st January 2026 and cancel the same on 4th February 2026, your subscription will continue till 31st December 2026 and there will be no automatic renewal.
                                </p>
                            </div>

                            <div className="bg-muted/50 rounded-2xl p-6 mt-4 space-y-4">
                                <h3 className="text-lg font-medium">Example: Monthly Subscription</h3>
                                <p className="text-muted-foreground text-sm">
                                    If you have purchased a monthly subscription on 1st January 2026 and cancel the same on 25th January 2026, your subscription will continue till 31st January 2026 and there will be no automatic renewal.
                                </p>
                            </div>
                        </section>

                        <section className="bg-destructive/10 border border-destructive/20 rounded-2xl p-6">
                            <h2 className="text-2xl font-semibold mb-4 text-destructive">No Refunds Policy</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                Please note that <strong>we do not provide any refunds</strong>. We have this policy in place, since it would be impossible for you to return your registered version of Virl. The digital nature of our product means that once access is granted, it cannot be revoked or returned.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4">Acceptance of This Policy</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                It is your responsibility to familiarize yourself with this refund policy. By placing an order for Virl free trial or full version, you acknowledge that you have read this refund policy, and that you fully agree with and accept the terms laid out in this refund policy.
                            </p>
                            <p className="text-muted-foreground leading-relaxed mt-4">
                                If you do not fully agree with or accept the terms laid out in this refund policy, please do not place an order with us.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4">Questions?</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                For any questions regarding this Refund Policy or any requests regarding refunds and returns, please contact us:
                            </p>
                            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-4">
                                <li>
                                    Email: <a href="mailto:hello@virl.in" className="text-primary hover:underline">hello@virl.in</a>
                                </li>
                                <li>
                                    Phone: <a href="tel:+918527004337" className="text-primary hover:underline">+91 85270 04337</a>
                                </li>
                            </ul>
                        </section>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default RefundPolicy;

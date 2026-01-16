import Navbar from "@/components/landing-lovable/Navbar";
import Footer from "@/components/landing-lovable/Footer";

const PrivacyPolicy = () => {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="pt-32 pb-20">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
                    <h1 className="text-4xl sm:text-5xl font-bold mb-8 gradient-text">Privacy Policy</h1>
                    <p className="text-muted-foreground mb-12">Last Updated: January 15, 2026</p>

                    <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
                        <section>
                            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                At Virl, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website https://virl.in and use our services.
                            </p>
                            <p className="text-muted-foreground leading-relaxed mt-4">
                                Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site or use our services.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                We may collect information about you in a variety of ways. The information we may collect includes:
                            </p>
                            <h3 className="text-xl font-medium mt-6 mb-3">Personal Data</h3>
                            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                                <li>Name and contact information (email address, phone number)</li>
                                <li>Business/company information</li>
                                <li>Billing and payment information</li>
                                <li>Account credentials</li>
                            </ul>
                            <h3 className="text-xl font-medium mt-6 mb-3">Device and Usage Data</h3>
                            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                                <li>IP address and browser type</li>
                                <li>Device information and operating system</li>
                                <li>Pages visited and time spent on pages</li>
                                <li>Referring website addresses</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4">3. Cookies and Tracking Technologies</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                We use cookies and similar tracking technologies to track activity on our website and store certain information. Cookies are files with a small amount of data that may include an anonymous unique identifier.
                            </p>
                            <p className="text-muted-foreground leading-relaxed mt-4">
                                We use Google Analytics to help us understand how our customers use the Site. You can read more about how Google uses your Personal Information at https://www.google.com/intl/en/policies/privacy/.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4">4. How We Use Your Information</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                We may use the information we collect about you for various purposes, including to:
                            </p>
                            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-4">
                                <li>Provide, operate, and maintain our services</li>
                                <li>Process transactions and send related information</li>
                                <li>Send you technical notices, updates, and support messages</li>
                                <li>Respond to your comments, questions, and customer service requests</li>
                                <li>Communicate with you about products, services, and promotions</li>
                                <li>Monitor and analyze usage and trends to improve user experience</li>
                                <li>Detect, prevent, and address technical issues and security threats</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4">5. Third-Party Service Providers</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                We may share your information with third-party service providers who perform services on our behalf, such as payment processing, data analysis, email delivery, hosting services, customer service, and marketing assistance.
                            </p>
                            <p className="text-muted-foreground leading-relaxed mt-4">
                                These third parties have access to your personal information only to perform these tasks on our behalf and are obligated not to disclose or use it for any other purpose.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4">6. Data Security</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                We use commercially reasonable safeguards to protect your personal information. However, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure.
                            </p>
                            <p className="text-muted-foreground leading-relaxed mt-4">
                                We do not store sensitive financial data such as credit card numbers on our servers. All payment processing is handled by secure third-party payment processors.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4">7. International Data Transfers</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                Your information may be transferred to and maintained on servers located in India. By using our services, you consent to the transfer of your information to India and other countries where we operate.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4">8. Your Rights</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                You have the right to:
                            </p>
                            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-4">
                                <li>Access and receive a copy of your personal data</li>
                                <li>Request correction of inaccurate personal data</li>
                                <li>Request deletion of your personal data</li>
                                <li>Object to or restrict the processing of your data</li>
                                <li>Withdraw consent at any time where we rely on consent to process your data</li>
                            </ul>
                            <p className="text-muted-foreground leading-relaxed mt-4">
                                To exercise any of these rights, please contact us at hello@virl.in.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4">9. Age Restrictions</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                Our services are not intended for individuals under the age of 18. We do not knowingly collect personal information from children under 18. If you become aware that a child has provided us with personal information, please contact us.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4">10. Changes to This Policy</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                We may update this privacy policy from time to time. We will notify you of any changes by posting the new privacy policy on this page and updating the "Last Updated" date.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4">11. Contact Us</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                If you have any questions about this Privacy Policy, please contact us at:
                            </p>
                            <p className="text-muted-foreground mt-4">
                                Email: <a href="mailto:hello@virl.in" className="text-primary hover:underline">hello@virl.in</a>
                            </p>
                        </section>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default PrivacyPolicy;

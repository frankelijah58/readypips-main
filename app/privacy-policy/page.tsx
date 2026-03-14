"use client";

import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";

export default function PrivacyPolicyPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-white dark:bg-black">
        {/* Header */}
        <section className="max-w-4xl mx-auto px-4 py-16">
          <h1 className="text-4xl md:text-5xl font-bold text-black dark:text-white mb-4">
            Privacy Policy
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Last updated: Jan 2026
          </p>
        </section>

        {/* Content */}
        <section className="max-w-4xl mx-auto px-4 pb-16 text-gray-700 dark:text-gray-300 space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-black dark:text-white mb-4">
              1. Introduction
            </h2>
            <p>
              Ready Pips (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;, or &quot;Company&quot;) operates the Ready Pips website and mobile application.
              This page informs you of our policies regarding the collection, use, and disclosure of personal data
              when you use our Service and the choices you have associated with that data.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-black dark:text-white mb-4">
              2. Information Collection and Use
            </h2>
            <p className="mb-3">We collect several different types of information for various purposes to provide and improve our Service to you.</p>
            <h3 className="text-xl font-semibold text-black dark:text-white mb-2">
              Types of Data Collected:
            </h3>
            <ul className="list-disc list-inside space-y-2">
              <li>Personal Data (name, email address, phone number, etc.)</li>
              <li>Usage Data (IP address, browser type, pages visited, etc.)</li>
              <li>Financial Data (payment information, transaction history)</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-black dark:text-white mb-4">
              3. Use of Data
            </h2>
            <p className="mb-3">Ready Pips uses the collected data for various purposes:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>To provide and maintain our Service</li>
              <li>To notify you about changes to our Service</li>
              <li>To allow you to participate in interactive features of our Service</li>
              <li>To provide customer support</li>
              <li>To gather analysis or valuable information so we can improve our Service</li>
              <li>To monitor the usage of our Service</li>
              <li>To detect, prevent and address technical issues and fraud</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-black dark:text-white mb-4">
              4. Security of Data
            </h2>
            <p>
              The security of your data is important to us, but remember that no method of transmission over the Internet
              or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect
              your Personal Data, we cannot guarantee its absolute security.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-black dark:text-white mb-4">
              5. Changes to This Privacy Policy
            </h2>
            <p>
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy
              on this page and updating the &quot;Last updated&quot; date at the top of this Privacy Policy.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-black dark:text-white mb-4">
              6. Contact Us
            </h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            
            <ul className="list-disc list-inside space-y-2 mt-4">
              <li>Instagram: Readypips</li>
              <li>Support: Enter Your query on the support page</li>
            </ul>
          </div>

          <div className="bg-green-50 dark:bg-green-900 p-6 rounded-lg">
            <p className="text-sm">
              By using Ready Pips, you acknowledge that you have read this Privacy Policy and agree to its terms.
              If you do not agree with our privacy policies and practices, please do not use our Service.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

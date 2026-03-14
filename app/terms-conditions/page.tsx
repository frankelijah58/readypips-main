"use client";

import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";

export default function TermsConditionsPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-white dark:bg-black">
        {/* Header */}
        <section className="max-w-4xl mx-auto px-4 py-16">
          <h1 className="text-4xl md:text-5xl font-bold text-black dark:text-white mb-4">
            Terms & Conditions
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Last updated: Jan 2026
          </p>
        </section>

        {/* Content */}
        <section className="max-w-4xl mx-auto px-4 pb-16 text-gray-700 dark:text-gray-300 space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-black dark:text-white mb-4">
              1. Agreement to Terms
            </h2>
            <p>
              By accessing and using the Ready Pips website and mobile application, you accept and agree to be bound by the terms and provision
              of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-black dark:text-white mb-4">
              2. License and Site Access
            </h2>
            <p className="mb-3">
              Ready Pips grants you a limited, non-exclusive, non-transferable license to access and use the Site and its content,
              subject to the terms and conditions of this Agreement. This license does not include:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>The right to modify or copy material</li>
              <li>The right to use this site for any commercial purpose or for any public display</li>
              <li>The right to attempt to decompile or reverse engineer any software</li>
              <li>The right to remove any copyright or proprietary notices</li>
              <li>The right to transfer the materials to another person or to &quot;mirror&quot; the materials on any other server</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-black dark:text-white mb-4">
              3. Disclaimer of Warranties
            </h2>
            <p>
              THE MATERIALS ON READY PIPS WEBSITE AND MOBILE APPLICATION ARE PROVIDED ON AN &quot;AS IS&quot; BASIS.
              READY PIPS MAKES NO WARRANTIES, EXPRESSED OR IMPLIED, AND HEREBY DISCLAIMS AND NEGATES ALL OTHER WARRANTIES
              INCLUDING, WITHOUT LIMITATION, IMPLIED WARRANTIES OR CONDITIONS OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE,
              OR NON-INFRINGEMENT OF INTELLECTUAL PROPERTY OR OTHER VIOLATION OF RIGHTS.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-black dark:text-white mb-4">
              4. Investment Risk Disclaimer
            </h2>
            <p className="mb-3">
              Trading and investing involve substantial risk of loss. Past performance does not guarantee future results.
              The trading signals provided by Ready Pips are educational in nature and should not be considered as financial advice.
            </p>
            <p>
              You acknowledge that:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li>You use the signals at your own risk</li>
              <li>No trading system is guaranteed to be profitable</li>
              <li>You should only trade with capital you can afford to lose</li>
              <li>You are responsible for your own trading decisions</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-black dark:text-white mb-4">
              5. Subscription Terms
            </h2>
            <p className="mb-3">
              Ready Pips offers subscription plans (Weekly, Monthly, 3 Months). By subscribing, you agree to:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>Automatic renewal at the end of each billing period unless cancelled</li>
              <li>Charges will appear on your payment method as &quot;Ready Pips&quot;</li>
              <li>You can cancel your subscription at any time through your account settings</li>
              <li>Refunds are subject to our refund policy</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-black dark:text-white mb-4">
              6. Limitations of Liability
            </h2>
            <p>
              IN NO EVENT SHALL READY PIPS, ITS DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE FOR ANY DAMAGES
              (WHETHER DIRECT, INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE) ARISING OUT OF YOUR USE
              OR INABILITY TO USE THE MATERIALS ON READY PIPS, EVEN IF READY PIPS HAS BEEN ADVISED OF THE POSSIBILITY
              OF SUCH DAMAGES.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-black dark:text-white mb-4">
              7. Governing Law
            </h2>
            <p>
              These terms and conditions are governed by and construed in accordance with the laws of Kenya,
              and you irrevocably submit to the exclusive jurisdiction of the courts located therein.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-black dark:text-white mb-4">
              8. Contact Information
            </h2>
            <p>
              If you have any questions about these Terms and Conditions, please contact us at:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4">
              <li>Instagram: Readypips</li>
              <li>Support: Enter Your query on the support page</li>
            </ul>
          </div>

          <div className="bg-green-50 dark:bg-green-900 p-6 rounded-lg">
            <p className="text-sm">
              By using Ready Pips, you acknowledge that you have read these Terms and Conditions
              and agree to be bound by all of the terms and conditions contained herein.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

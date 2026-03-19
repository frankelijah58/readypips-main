"use client";

import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function FAQsPage() {
  const faqs = [
    {
      question: "What are trading signals?",
      answer:
        "Trading signals are alerts that suggest when to buy or sell forex or crypto assets. Ready Pips uses TradingView-aligned analysis, market structure, and trading indicators to generate real-time signals for traders.",
    },
    {
      question: "How accurate are the signals?",
      answer:
        "Ready Pips signals are designed for high-probability setups based on historical data and structured strategy. However, no trading system is 100% accurate, and traders should always apply proper risk management.",
    },
    {
      question: "How do I receive signals?",
      answer:
        "Signals are generated in real-time and displayed directly on charts. Traders can monitor setups, entry points, stop loss, and take profit levels instantly.",
    },
    {
      question: "Can I use the platform on mobile?",
      answer:
        "Yes, Ready Pips is fully responsive and works on mobile devices. Traders can access TradingView-style analysis and signals from anywhere.",
    },
    {
      question: "What payment methods do you accept?",
      answer:
        "We support multiple payment options including M-Pesa, Paystack, Pesapal, and other digital payment systems for global access.",
    },
    {
      question: "Can I cancel my subscription anytime?",
      answer:
        "Yes, subscriptions can be cancelled at any time. There are no long-term contracts, and access continues until the billing period ends.",
    },
    {
      question: "Is my personal data safe?",
      answer:
        "Yes. All user data is encrypted and securely stored. Ready Pips follows modern data protection standards to ensure user safety.",
    },
    {
      question: "Do you offer a free trial?",
      answer:
        "Yes, new users can access a limited trial to explore the platform, test trading signals, and understand how the system works.",
    },
    {
      question: "What assets can I trade?",
      answer:
        "Ready Pips supports forex trading, crypto trading, and multiple global markets. Traders can analyze pairs and assets using structured signals.",
    },
    {
      question: "How often are signals generated?",
      answer:
        "Signals are generated continuously during market hours based on live analysis. Frequency depends on market conditions and strategy alignment.",
    },
  ];
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-white dark:bg-black">
        {/* Header */}
        <section className="max-w-4xl mx-auto px-4 py-16">
          <h1 className="text-4xl md:text-5xl font-bold text-black dark:text-white mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Find answers to common questions about Ready Pips and our trading signals.
          </p>
        </section>

        {/* FAQs Accordion */}
        <section className="max-w-4xl mx-auto px-4 pb-16">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-lg font-semibold text-black dark:text-white hover:text-green-600">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 dark:text-gray-400">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </main>
      <Footer />
    </>
  );
}

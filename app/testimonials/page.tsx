"use client";

import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star } from "lucide-react";

export default function TestimonialsPage() {
  const testimonials = [
    {
      name: "John Mwangi",
      role: "Professional Trader",
      content:
        "Ready Pips has transformed my trading journey. The accuracy of signals is remarkable, and I've been able to increase my profitability consistently. Highly recommended!",
      rating: 5,
      initials: "JM",
    },
    {
      name: "Sarah Kipchoge",
      role: "Forex Trader",
      content:
        "The platform is incredibly user-friendly. I started with the weekly plan and have now upgraded to 6 months. The customer support is fantastic too!",
      rating: 5,
      initials: "SK",
    },
    {
      name: "Michael Omondi",
      role: "Day Trader",
      content:
        "I've tried many signal services, but Ready Pips stands out. The real-time notifications and AI insights are game-changers for my trading strategy.",
      rating: 5,
      initials: "MO",
    },
    {
      name: "Emily Kariuki",
      role: "Investment Manager",
      content:
        "As an investment manager, I appreciate the advanced analytics and comprehensive market data. Ready Pips provides valuable insights for portfolio management.",
      rating: 5,
      initials: "EK",
    },
    {
      name: "David Muturi",
      role: "Crypto Trader",
      content:
        "The cryptocurrency signals are spot-on! I've been using Ready Pips for 6 months and consistently seeing positive returns. Great investment!",
      rating: 5,
      initials: "DM",
    },
    {
      name: "Lisa Akoth",
      role: "Stock Trader",
      content:
        "The stock signals have helped me build a more diversified portfolio. The 3-month plan is perfect for serious traders. Looking forward to continued success!",
      rating: 5,
      initials: "LA",
    },
    {
      name: "James Kiplagat",
      role: "Part-time Trader",
      content:
        "Started as a beginner, but Ready Pips made it easy to understand and execute trades. The educational content is valuable, and signals are precise.",
      rating: 5,
      initials: "JK",
    },
    {
      name: "Patricia Nduta",
      role: "Experienced Trader",
      content:
        "The platform's AI insights combined with technical analysis have elevated my trading game. I recommend Ready Pips to all my trading friends!",
      rating: 5,
      initials: "PN",
    },
  ];

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-white dark:bg-black">
        {/* Header */}
        <section className="max-w-5xl mx-auto px-4 py-16">
          <h1 className="text-4xl md:text-5xl font-bold text-black dark:text-white mb-4">
            What Our Users Say
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Join thousands of successful traders who trust Ready Pips for their daily trading signals.
          </p>
        </section>

        {/* Testimonials Grid */}
        <section className="max-w-5xl mx-auto px-4 pb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card
                key={index}
                className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:shadow-lg transition-shadow"
              >
                <CardContent className="pt-6">
                  {/* Stars */}
                  <div className="flex mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>

                  {/* Content */}
                  <p className="text-gray-700 dark:text-gray-300 mb-6">
                    &quot;{testimonial.content}&quot;
                  </p>

                  {/* Author */}
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarFallback className="bg-green-600 text-white">
                        {testimonial.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-black dark:text-white">
                        {testimonial.name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-5xl mx-auto px-4 pb-16">
          <Card className="bg-gradient-to-r from-green-600 to-green-700 border-0">
            <CardContent className="pt-8 pb-8 text-center">
              <h2 className="text-3xl font-bold text-white mb-4">
                Ready to Join Successful Traders?
              </h2>
              <p className="text-green-100 mb-6">
                Start with our weekly plan and experience the difference Ready Pips can make.
              </p>
              <a
                href="/subscription"
                className="inline-block bg-white text-green-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Choose Your Plan
              </a>
            </CardContent>
          </Card>
        </section>
      </main>
      <Footer />
    </>
  );
}

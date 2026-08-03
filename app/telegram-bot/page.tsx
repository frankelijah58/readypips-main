"use client";

import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Bot, ExternalLink } from "lucide-react";

export default function TelegramBotPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Navigation />
      <section className="relative py-20 px-4 overflow-hidden bg-gradient-to-br from-green-900 via-black to-green-900">
        <div className="container mx-auto text-center relative z-10 max-w-3xl">
          <Badge className="mb-6 bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800" variant="outline">
            <Bot className="w-3 h-3 mr-1" />
            ReadyPips Telegram Bot
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white leading-tight">
            Trade alerts on <span className="text-green-400">Telegram</span>
          </h1>
          <p className="text-lg text-gray-100 mb-8 leading-relaxed">
            Get ReadyPips signals, market updates, and support directly in Telegram.
            Connect the bot to stay notified wherever you are.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild className="bg-green-600 hover:bg-green-700 text-white">
              <a href="https://t.me/readypips" target="_blank" rel="noopener noreferrer">
                <MessageSquare className="w-4 h-4 mr-2" />
                Open Telegram Bot
                <ExternalLink className="w-4 h-4 ml-2" />
              </a>
            </Button>
          </div>
        </div>
      </section>
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-black dark:text-white mb-4">How it works</h2>
          <ol className="text-left text-gray-600 dark:text-gray-300 space-y-3 list-decimal list-inside">
            <li>Open the ReadyPips bot on Telegram.</li>
            <li>Start the bot and link your ReadyPips account if prompted.</li>
            <li>Receive trading signals and updates in real time.</li>
          </ol>
        </div>
      </section>
      <Footer />
    </div>
  );
}

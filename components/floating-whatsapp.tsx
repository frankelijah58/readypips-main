"use client";

import { Send } from "lucide-react";
import Link from "next/link";

export function FloatingWhatsApp() {
  const telegramLink = "https://t.me/tradecafeafrica";

  return (
    <Link href={telegramLink} target="_blank" rel="noopener noreferrer">
      <div className="fixed bottom-6 right-6 z-50">
        <button
          className="flex items-center justify-center w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all duration-300 hover:scale-110 active:scale-95"
          aria-label="Contact us on Telegram"
          title="Chat with us on Telegram"
        >
          <Send className="w-6 h-6" />
        </button>
      </div>
    </Link>
  );
}

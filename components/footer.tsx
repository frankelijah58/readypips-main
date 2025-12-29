"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer className="py-12 px-4 bg-gray-900 text-white">
      <div className="container mx-auto">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center mb-4">
              <div className="relative h-8">
                <img
                  src="/logo-dark.png"
                  alt="Ready Pips Logo"
                  className="h-8 w-auto"
                />
              </div>
            </div>
            <p className="text-gray-400">
              Unlock Powerful AI-Driven Trading Signals for a Competitive Edge
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link href="/signals" className="hover:text-white">
                  Signals Tool
                </Link>
              </li>
              <li>
                <Link href="/copy-trading" className="hover:text-white">
                  Copy Trading
                </Link>
              </li>
              <li>
                <Link href="/charts" className="hover:text-white">
                  Charts
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link href="/support" className="hover:text-white">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/support" className="hover:text-white">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link href="/admin/login" className="hover:text-white">
                  Admin Dashboard
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="hover:text-white">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2025 Ready Pips. All rights reserved.</p>
          <p className="mt-2">
            Developed and maintained by{" "}
            <a
              href="https://#/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-400 hover:text-green-300 font-semibold transition-colors"
            >
              Maxson Programming Limited
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { SignalServiceProvider } from "@/components/signal-service-provider";
import { AuthProvider } from "@/components/auth-context";
import { PhoneCheckWrapper } from "@/components/phone-check-wrapper";
import { FloatingWhatsApp } from "@/components/floating-whatsapp";
import ClientSessionProvider from "@/components/client-session-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Ready Pips - AI-Powered Trading Signals Platform",
    template: "%s | Ready Pips",
  },
  description:
    "Get real-time, AI-powered trading signals with up to 93% accuracy. Join thousands of successful traders using our proprietary algorithm for forex, crypto, and stocks.",
  keywords: [
    "trading signals",
    "forex signals",
    "crypto signals",
    "stock analysis",
    "AI trading",
    "trading platform",
    "market analysis",
    "investment signals",
    "trading alerts",
    "financial markets",
  ],
  authors: [{ name: "Ready Pips Team" }],
  creator: "Ready Pips",
  publisher: "Ready Pips",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://readypips.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://readypips.com",
    title: "Ready Pips - AI-Powered Trading Signals Platform",
    description:
      "Get real-time, AI-powered trading signals with up to 93% accuracy. Join thousands of successful traders using our proprietary algorithm.",
    siteName: "Ready Pips",
    images: [
      {
        url: "/readypips_ico.png",
        width: 1200,
        height: 630,
        alt: "Ready Pips - AI-Powered Trading Signals Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ready Pips - AI-Powered Trading Signals Platform",
    description:
      "Get real-time, AI-powered trading signals with up to 93% accuracy. Join thousands of successful traders.",
    images: ["/readypips_ico.png"],
    creator: "@readypips",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
    yandex: "your-yandex-verification-code",
    yahoo: "your-yahoo-verification-code",
  },
  icons: {
    icon: "/readypips_ico.png",
    shortcut: "/readypips_ico.png",
    apple: "/readypips_ico.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* <script src="https://s3.tradingview.com/tv.js" async /> */}
        <script src="https://code.jquery.com/jquery-3.6.0.min.js" async />
        <script
          src="https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.4/moment.min.js"
          async
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Prevent autofill extension conflicts
              (function() {
                // Disable problematic autofill overlays
                const disableAutofillOverlays = () => {
                  const overlays = document.querySelectorAll('[data-autofill-overlay]');
                  overlays.forEach(overlay => {
                    if (overlay.parentNode) {
                      overlay.parentNode.removeChild(overlay);
                    }
                  });
                };

                // Run on DOM ready
                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', disableAutofillOverlays);
                } else {
                  disableAutofillOverlays();
                }

                // Run on dynamic content changes
                const observer = new MutationObserver(disableAutofillOverlays);
                if (document.body) {
                  observer.observe(document.body, {
                    childList: true,
                    subtree: true
                  });
                }

                // Prevent insertBefore errors from autofill extensions
                const originalInsertBefore = Node.prototype.insertBefore;
                Node.prototype.insertBefore = function(newNode, referenceNode) {
                  try {
                    return originalInsertBefore.call(this, newNode, referenceNode);
                  } catch (error) {
                    if (error.name === 'NotFoundError' && error.message.includes('insertBefore')) {
                      console.warn('Autofill extension conflict prevented:', error.message);
                      return newNode;
                    }
                    throw error;
                  }
                };
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <ClientSessionProvider>
            <AuthProvider>
              <PhoneCheckWrapper>
                <SignalServiceProvider />
                {children}
                <Toaster />
                {/* <FloatingWhatsApp /> */}
              </PhoneCheckWrapper>
            </AuthProvider>
          </ClientSessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

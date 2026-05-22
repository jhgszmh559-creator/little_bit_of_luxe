import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Little Bit of Luxe | Premium Luxury Hotel Travel Journal",
  description: "A travel journal for the kind of places worth going slowly. Trusted recommendations, never breathless promotion.",
  metadataBase: new URL("https://littlebitofluxe.com"),
  openGraph: {
    title: "Little Bit of Luxe",
    description: "A travel journal for the kind of places worth going slowly.",
    siteName: "Little Bit of Luxe",
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const umamiWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID || "d64a1b02-0aaf-4a1c-b701-403a9b5f7701";

  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${manrope.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        {/* Umami Tracking Script */}
        <script 
          defer 
          src="https://cloud.umami.is/script.js" 
          data-website-id={umamiWebsiteId}
        />
      </head>
      <body className="min-h-full flex flex-col bg-paper text-midnight selection:bg-sand selection:text-midnight transition-colors duration-200">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}


import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"
import Script from "next/script"
import { Providers } from "../providers/providers"
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

const APP_NAME = "Krishna Connect";
const APP_DEFAULT_TITLE = "Krishna Connect";
const APP_TITLE_TEMPLATE = "%s | Krishna Connect";
const APP_DESCRIPTION = "A modern, real-time chat application for the conscious community, now powered by AI.";
const APP_URL = "https://krishnaconnect.com";
const APP_DEFAULT_URL = new URL(APP_URL);

export const metadata: Metadata = {
  metadataBase: APP_DEFAULT_URL,
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  manifest: "/site.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_DEFAULT_TITLE,
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    // Required OG properties
    type: "website",
    url: APP_URL,
    title: APP_DEFAULT_TITLE,
    images: [
      {
        url: `${APP_URL}/logo/krishna_connect.png`,
        secureUrl: `${APP_URL}/logo/krishna_connect.png`,
        width: 512,
        height: 512,
        alt: 'Krishna Connect Logo - A modern chat application for the conscious community',
        type: 'image/png',
      }
    ],

    // Optional OG properties
    description: APP_DESCRIPTION,
    siteName: APP_NAME,
    locale: 'en_US',
  },
  twitter: {
    card: "summary_large_image",
    title: APP_DEFAULT_TITLE,
    description: APP_DESCRIPTION,
    images: [`${APP_URL}/logo/krishna_connect.png`],
    creator: '@KrishnaConnect',
    site: '@KrishnaConnect',
  },
  other: {
    "google-adsense-account": process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID!,
  },
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("font-sans antialiased", inter.variable)} suppressHydrationWarning>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-ZRN1L5GXJ4"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-ZRN1L5GXJ4');
          `}
        </Script>
        <script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}`}
          crossOrigin="anonymous"
        />
        <Providers>
          {children}
        </Providers>
        <SpeedInsights />
        <Analytics />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/service-worker.js').then(registration => {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                  }, err => {
                    console.log('ServiceWorker registration failed: ', err);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}

import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import ConsentAnalytics from "@/components/ConsentAnalytics";
import CookieConsent from "@/components/CookieConsent";
import TelegramFloat from "@/components/TelegramFloat";

const interSans = Inter({
  variable: "--font-display",
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://aepovcg.pro"),
  title: {
    default: "Epov Creative Labs — 3D Motion Designer & CG Generalist",
    template: "%s — Epov Creative Labs",
  },
  description:
    "Epov Creative Labs — 3D Motion Designer and CG Generalist. Procedural animation in Houdini, product visualization, simulations and pipeline tools for brands and studios.",
  keywords: [
    "3d motion designer",
    "motion design",
    "cg generalist",
    "houdini",
    "blender",
    "product visualization",
    "vfx",
    "fluid simulation",
    "vellum cloth",
  ],
  authors: [{ name: "Andrey Epov", url: "https://aepovcg.pro" }],
  creator: "Andrey Epov",
  publisher: "Epov Creative Labs",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: "Epov Creative Labs",
    title: "Epov Creative Labs — 3D Motion Designer & CG Generalist",
    description:
      "Procedural animation in Houdini, product visualization, simulations and pipeline tools for brands and studios.",
    url: "https://aepovcg.pro",
    images: [
      {
        url: "/works/cosmos/cover.webp",
        width: 1200,
        height: 630,
        alt: "Epov Creative Labs — 3D Motion Design & CG",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Epov Creative Labs — 3D Motion Designer & CG Generalist",
    description:
      "Procedural animation in Houdini, product visualization, simulations and pipeline tools for brands and studios.",
    images: ["/works/cosmos/cover.webp"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${interSans.variable} ${jetbrainsMono.variable} antialiased`}
    >
      <body>
        <ConsentAnalytics />
        <Providers>
          {children}
          <CookieConsent />
          <TelegramFloat />
        </Providers>
      </body>
    </html>
  );
}

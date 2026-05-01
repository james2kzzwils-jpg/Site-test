import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "James Creative Labs — Motion Design & CG Solutions",
  description:
    "Motion Design & CG Generalist. Procedural animation, product visualization, and technical solutions for brands and studios.",
  keywords: [
    "motion design",
    "CG generalist",
    "3D animation",
    "Houdini",
    "product visualization",
    "VFX",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${geistMono.variable} antialiased`}>
      <body>{children}</body>
    </html>
  );
}

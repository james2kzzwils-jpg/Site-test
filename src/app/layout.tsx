import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

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
  title: "Epov Creative Labs — 3D Motion Designer & CG Generalist",
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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

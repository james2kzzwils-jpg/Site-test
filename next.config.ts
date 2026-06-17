import type { NextConfig } from "next";

// Phase A note: we are dropping `output: "export"` so the portal can use
// middleware, server components, route handlers, and Supabase SSR helpers.
// Marketing routes remain static via SSG; portal routes under /portal/*
// opt into dynamic rendering individually.
const nextConfig: NextConfig = {
  // Gzip/Brotli the HTML and assets Next serves directly (Cloudflare also
  // compresses, but keeping it on covers the origin too).
  compress: true,
  // Drop the `X-Powered-By: Next.js` header — small response saving + less
  // fingerprinting.
  poweredByHeader: false,
  // Tree-shake heavy libraries so only the helpers actually used ship to the
  // browser, trimming the JS the main thread must parse before the page
  // becomes interactive.
  experimental: {
    optimizePackageImports: ["three", "@react-three/fiber", "gsap"],
  },
};

export default nextConfig;

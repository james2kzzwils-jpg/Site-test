import type { NextConfig } from "next";

// Phase A note: we are dropping `output: "export"` so the portal can use
// middleware, server components, route handlers, and Supabase SSR helpers.
// Marketing routes remain static via SSG; portal routes under /portal/*
// opt into dynamic rendering individually.
const nextConfig: NextConfig = {};

export default nextConfig;

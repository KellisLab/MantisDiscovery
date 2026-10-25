import type { NextConfig } from "next";

// Built as static files (out/) for GitHub Pages, which serves the site from a sub-path such as
// /MantisDiscovery/. The deploy workflow passes that path in PAGES_BASE_PATH; it is empty for local
// development and for a custom domain.
const basePath = process.env.PAGES_BASE_PATH ?? "";

// Cache Components is off on purpose: it keeps previous routes mounted (hidden) inside <Activity>,
// and the motion engine initializes whatever is in the document. Every page here is static.
const nextConfig: NextConfig = {
  output: "export",
  basePath,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  trailingSlash: true,
  poweredByHeader: false,
};

export default nextConfig;

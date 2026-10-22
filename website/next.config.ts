import type { NextConfig } from "next";

// The plate harness (src/app/plates-lab/[id]/page.dev.tsx) exists in development only: the .dev.tsx
// extension is a page extension in `next dev` and an ordinary file in production builds.
const dev = process.env.NODE_ENV !== "production";

// Cache Components is off on purpose: it keeps previous routes mounted (hidden) inside <Activity>,
// and the motion engine initializes whatever is in the document. Every page here is static.
const nextConfig: NextConfig = {
  trailingSlash: true,
  poweredByHeader: false,
  pageExtensions: dev ? ["dev.tsx", "tsx", "ts", "jsx", "js"] : ["tsx", "ts", "jsx", "js"],
};

export default nextConfig;

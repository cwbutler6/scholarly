import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

const isSentryConfigured =
  process.env.SENTRY_AUTH_TOKEN &&
  !process.env.SENTRY_AUTH_TOKEN.includes("sntrys_...") &&
  process.env.SENTRY_ORG &&
  !process.env.SENTRY_ORG.includes("your-sentry-org");

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  sourcemaps: {
    disable: !isSentryConfigured,
  },
});

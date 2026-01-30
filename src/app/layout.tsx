import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Outfit, JetBrains_Mono } from "next/font/google";
import { PostHogProvider, PostHogPageview, PostHogUserIdentifier } from "@/lib/posthog";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Scholarly",
    template: "%s | Scholarly",
  },
  description:
    "Career guidance platform for high school students. Explore careers, discover your interests, and plan your future.",
  keywords: ["career", "education", "high school", "RIASEC", "career guidance"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        cssLayerName: "clerk",
      }}
    >
      <html lang="en">
        <body
          className={`${outfit.variable} ${jetbrainsMono.variable} antialiased`}
        >
          <PostHogProvider>
            <PostHogUserIdentifier />
            <PostHogPageview />
            {children}
          </PostHogProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}

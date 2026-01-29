import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import { PostHogProvider, PostHogPageview } from "@/lib/posthog";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
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
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <PostHogProvider>
            <PostHogPageview />
            {children}
          </PostHogProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}

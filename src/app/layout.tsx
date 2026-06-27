import {ClerkProvider} from "@clerk/nextjs";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sahay — Your AI Wellness Companion",
  description:
    "A calm, supportive AI companion that helps exam students track mood, journal their thoughts, and receive personalized coping strategies.",
  keywords: ["mental health", "exam stress", "wellness", "NEET", "JEE", "UPSC", "student wellbeing"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#f7f5f0" />
      </head>
      <body>
        <ClerkProvider>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
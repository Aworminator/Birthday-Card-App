import type { Metadata } from "next";
import { Geist, Geist_Mono, Lobster } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const lobster = Lobster({
  weight: "400",
  variable: "--font-lobster",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Circle Cards",
  description: "Create and share personalized voice message cards",
  openGraph: {
    title: "Circle Cards",
    description: "Create and share personalized voice message cards",
    siteName: "Circle Cards",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Circle Cards",
    description: "Create and share personalized voice message cards",
  },
  icons: {
    icon: "/app/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${lobster.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

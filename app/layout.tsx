import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://questloop.app"),
  title: "QuestLoop — Turn intentions into visible progress.",
  description: "Join people working toward the same goal, share proof of your progress, and keep going together.",
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png", sizes: "64x64" }],
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    title: "QuestLoop — Turn intentions into visible progress.",
    description: "Join a quest. Share proof. Keep going together.",
    url: "https://questloop.app",
    siteName: "QuestLoop",
    type: "website",
    images: [{ url: "/og-v2.png", width: 1733, height: 907, alt: "QuestLoop — Turn intentions into visible progress." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "QuestLoop — Turn intentions into visible progress.",
    description: "Join a quest. Share proof. Keep going together.",
    images: ["/og-v2.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body>
    </html>
  );
}

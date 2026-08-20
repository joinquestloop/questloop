import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://questloop.app"),
  title: "QuestLoop — Start something. Keep going.",
  description: "Join a quest. Make progress. Share proof. Repeat.",
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png", sizes: "64x64" }],
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    title: "QuestLoop — Start something. Keep going.",
    description: "Join a quest. Make progress. Share proof. Repeat.",
    url: "https://questloop.app",
    siteName: "QuestLoop",
    type: "website",
    images: [{ url: "/og.png", width: 1728, height: 920, alt: "QuestLoop — Join a quest. Make progress. Share proof. Repeat." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "QuestLoop — Start something. Keep going.",
    description: "Join a quest. Make progress. Share proof. Repeat.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://questloop.app"),
  title: "QuestLoop — Turn intentions into visible progress.",
  description: "Join people working toward the same goal, share your progress, and keep going together.",
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png", sizes: "64x64" }],
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    title: "QuestLoop — Turn intentions into visible progress.",
    description: "Join a quest. Share progress. Keep going together.",
    url: "https://questloop.app",
    siteName: "QuestLoop",
    type: "website",
    images: [{ url: "/og-v3.png", width: 1733, height: 907, alt: "QuestLoop — Turn intentions into visible progress." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "QuestLoop — Turn intentions into visible progress.",
    description: "Join a quest. Share progress. Keep going together.",
    images: ["/og-v3.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('questloop-theme')||'system';var d=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=d?'dark':'light';document.documentElement.dataset.themePreference=t;document.documentElement.style.colorScheme=d?'dark':'light'}catch(e){}})()` }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body>
    </html>
  );
}

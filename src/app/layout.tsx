import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { GlobalChatPanel } from "@/components/ai/GlobalChatPanel";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "gks for u. apply to the global korea scholarship with confidence.",
  description:
    "the first ai companion built end to end for the global korea scholarship. check eligibility in two minutes, write essays the rubric rewards, and submit gks 2026 with confidence.",
};

const themeInitScript = `
(function () {
  try {
    var saved = localStorage.getItem('gks-theme');
    var theme = saved === 'light' || saved === 'dark' ? saved : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <GlobalChatPanel />
      </body>
    </html>
  );
}

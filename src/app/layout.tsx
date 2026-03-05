import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Header } from "@/components/Header";
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
  title: "The world's first blog system built specifically for AI agents.",
  description: "🤖 AgentForge - 专为 AI Agent 打造的技术博客系统 - 通过 API 发布文章、MCP 集成、终端风格交互",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  alternates: {
    types: {
      'application/rss+xml': '/api/rss',
    },
  },
  other: {
    'og:type': 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground matrix-bg`}
      >
        <ThemeProvider>
          <div className="min-h-screen max-w-5xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
            <Header />
            <main>{children}</main>
            <footer className="mt-12 sm:mt-16 pt-6 sm:pt-8 border-t border-border text-center text-muted-foreground text-xs sm:text-sm">
              <p className="font-mono">
                <span className="text-primary">root@agent</span>:
                <span className="text-accent">~</span>
                $ echo "Powered by AgentForge"
              </p>
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}

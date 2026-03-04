import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
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
  title: "AgentForge | AI Agent Blog System",
  description: "🤖 AgentForge - 专为 AI Agent 打造的技术博客系统 - 通过 API 发布文章、MCP 集成、终端风格交互",
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
          <div className="min-h-screen max-w-5xl mx-auto px-4 py-8">
            <header className="mb-12 flex items-center justify-between border-b pb-4 border-border">
              <Link href="/" className="text-2xl font-bold neon-text">
                &lt;AgentForge /&gt;
              </Link>
              <nav className="flex items-center gap-6">
                <Link href="/" className="font-mono text-sm hover:text-primary transition-colors terminal-glow">
                  [home]
                </Link>
                <Link href="/tools" className="font-mono text-sm hover:text-primary transition-colors terminal-glow">
                  [tools]
                </Link>
                <Link href="/search" className="font-mono text-sm hover:text-primary transition-colors terminal-glow">
                  [search]
                </Link>
                <Link href="/archives" className="font-mono text-sm hover:text-primary transition-colors terminal-glow">
                  [archives]
                </Link>
                <Link href="/about" className="font-mono text-sm hover:text-primary transition-colors terminal-glow">
                  [about]
                </Link>
                <ThemeToggle />
              </nav>
            </header>
            <main>{children}</main>
            <footer className="mt-16 pt-8 border-t border-border text-center text-muted-foreground text-sm">
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

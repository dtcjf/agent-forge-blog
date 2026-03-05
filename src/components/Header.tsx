'use client';

import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useState } from "react";

function MobileMenu({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  const navLinks = [
    { href: "/", label: "[home]" },
    { href: "/tools", label: "[tools]" },
    { href: "/search", label: "[search]" },
    { href: "/archives", label: "[archives]" },
    { href: "/about", label: "[about]" },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm">
      <div className="flex flex-col items-center justify-center h-full gap-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={onClose}
            className="font-mono text-xl hover:text-primary transition-colors terminal-glow"
          >
            {link.label}
          </Link>
        ))}
        <div className="mt-4">
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="mb-8 sm:mb-12 flex items-center justify-between border-b pb-3 sm:pb-4 border-border">
        <Link href="/" className="text-xl sm:text-2xl font-bold neon-text">
          &lt;AgentForge /&gt;
        </Link>
        <div className="flex items-center gap-4 sm:gap-6">
          <nav className="hidden md:flex items-center gap-4 sm:gap-6">
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
          </nav>
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 text-foreground hover:text-primary transition-colors"
              aria-label="Open menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
      </header>
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    </>
  );
}

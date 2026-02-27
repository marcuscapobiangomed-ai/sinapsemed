"use client";

import { useState } from "react";
import Link from "next/link";
import { Brain, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LandingNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary transition-transform group-hover:scale-105">
            <Brain className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight">SinapseMED</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
          <a href="#como-funciona" className="hover:text-foreground transition-colors">Como funciona</a>
          <a href="#funcionalidades" className="hover:text-foreground transition-colors">Funcionalidades</a>
          <a href="#precos" className="hover:text-foreground transition-colors">Preços</a>
          <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">Entrar</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/register">Criar conta grátis</Link>
          </Button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-md hover:bg-accent"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t bg-background px-4 py-4 space-y-4">
          <nav className="flex flex-col gap-3 text-sm font-medium">
            <a href="#como-funciona" onClick={() => setOpen(false)} className="hover:text-primary transition-colors">Como funciona</a>
            <a href="#funcionalidades" onClick={() => setOpen(false)} className="hover:text-primary transition-colors">Funcionalidades</a>
            <a href="#precos" onClick={() => setOpen(false)} className="hover:text-primary transition-colors">Preços</a>
            <a href="#faq" onClick={() => setOpen(false)} className="hover:text-primary transition-colors">FAQ</a>
          </nav>
          <div className="flex flex-col gap-2 pt-2 border-t">
            <Button variant="outline" asChild>
              <Link href="/login">Entrar</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Criar conta grátis</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}

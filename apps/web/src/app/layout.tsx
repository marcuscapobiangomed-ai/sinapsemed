import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { PostHogProvider } from "@/components/posthog-provider";
import { PostHogPageview } from "@/components/posthog-pageview";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://sinapsemed.com";
const SITE_DESCRIPTION =
  "Plataforma de estudo com repetição espaçada e IA preditiva para aprovação em residência médica. ENARE, ENAMED, USP e mais.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "SinapseMED - Estudo Inteligente para Residência Médica",
    template: "%s | SinapseMED",
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "SinapseMED",
    title: "SinapseMED - Estudo Inteligente para Residência Médica",
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "SinapseMED - Estudo Inteligente para Residência Médica",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SinapseMED - Estudo Inteligente para Residência Médica",
    description: SITE_DESCRIPTION,
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <PostHogProvider>
          <ThemeProvider>
            <PostHogPageview />
            <TooltipProvider>
              {children}
            </TooltipProvider>
            <Toaster position="top-right" richColors />
          </ThemeProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}

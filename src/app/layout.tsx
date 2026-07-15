import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { ThemeToggle } from "@/app/theme-toggle";
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
  title: "Mesa de Ayuda | Sistema de Tickets",
  description: "Sistema full-stack de tickets y soporte tecnico para portafolio.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full bg-background text-foreground antialiased">
        <Script id="theme-init" strategy="beforeInteractive">
          {`
            try {
              var theme = localStorage.getItem('theme') === 'dark' ? 'dark' : 'light';
              document.documentElement.dataset.theme = theme;
            } catch (_) {
              document.documentElement.dataset.theme = 'light';
            }
          `}
        </Script>
        {children}
        <ThemeToggle />
      </body>
    </html>
  );
}

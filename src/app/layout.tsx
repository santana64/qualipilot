import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { CookieConsent } from "@/components/cookie-consent";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "QualiPilot - Pilotage Qualiopi pour formateurs",
  description:
    "SaaS français pour centraliser les preuves, suivre les indicateurs RNQ et préparer un dossier audit Qualiopi structuré.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full">
      <body className={`${inter.variable} min-h-full bg-background text-foreground antialiased`}>
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}

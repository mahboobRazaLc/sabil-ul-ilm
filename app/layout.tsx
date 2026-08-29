import type { Metadata } from "next";
import { Suspense } from "react";
import { Noto_Nastaliq_Urdu, Noto_Sans_Arabic, Amiri } from "next/font/google";
import { NavigationLoader } from "@/components/navigation-loader";
import "./globals.css";

const notoNastaliqUrdu = Noto_Nastaliq_Urdu({
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  variable: "--font-nastaliq",
  display: "swap",
});

const notoSansArabic = Noto_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "600", "700"],
  variable: "--font-arabic",
  display: "swap",
});

const amiri = Amiri({
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  variable: "--font-amiri",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sabeel-ul-Ilm — Dars-e-Nizami Online",
  description: "A premium Islamic learning platform for Dars-e-Nizami students. Access curriculum classes, video lessons, PDF resources, and teacher support.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${notoNastaliqUrdu.variable} ${notoSansArabic.variable} ${amiri.variable}`}>
        <Suspense fallback={null}>
          <NavigationLoader />
        </Suspense>
        {children}
      </body>
    </html>
  );
}

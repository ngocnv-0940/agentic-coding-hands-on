import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getLocale } from "@/lib/i18n/get-locale";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// The locale comes from a cookie, so the whole app renders per request. Opting the root out of
// static-shell validation is the documented way to allow this (docs: 01-app/03-api-reference/
// 03-file-conventions/02-route-segment-config/instant.md, "Disabling static shell validation").
export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  return { title: getDictionary(await getLocale())["meta.title"] };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

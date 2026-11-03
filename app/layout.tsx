import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { ToastProvider } from "@/components/ui/Toast";
import { ThemeInit } from "@/components/ThemeInit";
import { LanguageProvider } from "@/components/LanguageProvider";
import { getLanguage } from "@/lib/i18n-server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Personal Planner",
  description: "Personal planner estilo IBM/Lotus Organizer",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const language = await getLanguage();

  return (
    <html
      lang={language}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full">
        <ThemeInit />
        <LanguageProvider initialLanguage={language}>
          <ToastProvider>
            <div className="flex h-full">
              <Sidebar />
              <main className="flex-1 overflow-x-hidden">{children}</main>
            </div>
          </ToastProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}

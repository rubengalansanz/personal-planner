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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const language = await getLanguage();

  return (
    <html
      lang={language}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem("theme");var d=s?s==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;var r=document.documentElement;if(d)r.classList.add("dark");else r.classList.remove("dark");r.style.colorScheme=d?"dark":"light";}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
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

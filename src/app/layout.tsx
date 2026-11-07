import type { Metadata } from "next";
import { Assistant, Frank_Ruhl_Libre, Heebo, Rubik } from "next/font/google";
import "./globals.css";
import { uiLocale, uiTheme } from "@/server/session";

const heebo = Heebo({ subsets: ["hebrew", "latin"], variable: "--font-heebo" });
const frank = Frank_Ruhl_Libre({ subsets: ["hebrew", "latin"], variable: "--font-frank", weight: ["400", "500", "700"] });
const rubik = Rubik({ subsets: ["hebrew", "latin"], variable: "--font-rubik" });
const assistant = Assistant({ subsets: ["hebrew", "latin"], variable: "--font-assistant" });

export const metadata: Metadata = {
  title: "LaunchLab",
  description: "מסטודיו אחד: מרעיון עסקי לתוכנית השקה, מותג, אתר, מספרים ומפת דרכים.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await uiLocale();
  const theme = await uiTheme();
  return (
    <html lang={locale} dir={locale === "he" ? "rtl" : "ltr"} className={theme === "dark" ? "dark" : undefined}>
      <body className={`${heebo.variable} ${frank.variable} ${rubik.variable} ${assistant.variable} antialiased`}>
        <a href="#content" className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-50 focus:bg-accent focus:px-3 focus:py-2 focus:text-ink">
          {locale === "he" ? "דילוג לתוכן" : "Skip to content"}
        </a>
        {children}
      </body>
    </html>
  );
}

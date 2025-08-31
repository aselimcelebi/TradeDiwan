import "./globals.css";
import { ReactNode } from "react";
import { LanguageProvider } from "@/contexts/language-context";
import { BrokerProvider } from "@/contexts/broker-context";

export const metadata = {
  title: "TradeDiwan - Professional Trading Analytics",
  description: "TradeDiwan: Advanced trade journal and analytics platform for professional traders",
  keywords: "trading, journal, analytics, forex, crypto, stocks, trading diary",
  authors: [{ name: "TradeDiwan Team" }],
  creator: "TradeDiwan",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="alternate icon" href="/favicon.svg" />
      </head>
      <body className="bg-bg antialiased">
        <LanguageProvider>
          <BrokerProvider>
            {children}
          </BrokerProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}

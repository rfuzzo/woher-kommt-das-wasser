import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wie viel Wasser hat Österreich?",
  description: "Aktuelle Niederschlags-, Abfluss-, Schnee- und Grundwassermessungen aus offenen österreichischen Daten.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}

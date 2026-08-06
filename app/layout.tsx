import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wie viel Wasser hat Österreich?",
  description: "Österreichs Wasserjahr: Flüsse live, Schnee und Grundwasser im saisonalen Zusammenhang.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "HuntDex — Hunts, histórico e analytics do PxG",
  description:
    "Analise hunts do PxG, acompanhe seu histórico e sincronize seus dados opcionalmente com uma conta Discord.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body>{children}</body>
    </html>
  );
}

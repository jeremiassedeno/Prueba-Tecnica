import type { Metadata } from "next";
import { DM_Sans, Manrope } from "next/font/google";
import "./globals.css";

const sans = DM_Sans({ subsets: ["latin"], variable: "--font-sans" });
const display = Manrope({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  title: "GranaBank · Tu banco, a tu ritmo",
  description:
    "Home banking de demostración. Consultá tu saldo, transferí y seguí tus movimientos.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-AR" className={`${sans.variable} ${display.variable}`}>
      <body>{children}</body>
    </html>
  );
}

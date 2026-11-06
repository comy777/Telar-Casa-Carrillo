import type { Metadata } from "next";
import { Alfa_Slab_One, Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import { Proveedores } from "./proveedores";

const alfa = Alfa_Slab_One({ weight: "400", subsets: ["latin"], variable: "--font-alfa", display: "swap" });
const hanken = Hanken_Grotesk({ weight: ["400", "500", "600", "700"], subsets: ["latin"], variable: "--font-hanken", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Panel · Telar Casa Carrillo", template: "%s · Panel" },
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CO" className={`${alfa.variable} ${hanken.variable}`}>
      <body>
        <Proveedores>{children}</Proveedores>
      </body>
    </html>
  );
}

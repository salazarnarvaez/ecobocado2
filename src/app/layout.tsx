import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rescates de Sobras Locales",
  description:
    "Mercado local para publicar comida gratis o con grandes descuentos y reducir el desperdicio alimentario.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-[#f4f7f2] text-slate-900 antialiased">{children}</body>
    </html>
  );
}

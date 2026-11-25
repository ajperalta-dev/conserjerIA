import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "./globals.css";
export const metadata: Metadata = {
  title: "ConserjerIA · Administración inteligente de edificios",
  description:
    "Plataforma de administración de consorcios en Mendoza, Argentina.",
  icons: { icon: "/brand/favicon.svg" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR">
      <body>{children}</body>
    </html>
  );
}

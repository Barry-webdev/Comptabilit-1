import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Groupe Scolaire Elhadj Amadou Bendougou Bah — Gestion Financière",
  description: "Système de gestion financière du Groupe Scolaire Elhadj Amadou Bendougou Bah",
  icons: {
    icon: "/Logo.gif",
    shortcut: "/Logo.gif",
    apple: "/Logo.gif",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${plusJakartaSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

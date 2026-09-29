import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import AuthProvider from "../components/providers/AuthProvider";
import { TenantProvider } from "../components/tenant/TenantProvider";
const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "EduTrack",
  description: "School Management SaaS",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} min-h-screen bg-slate-950 text-white antialiased`}
      >
        <TenantProvider>
          <AuthProvider>{children}</AuthProvider>
        </TenantProvider>
      </body>
    </html>
  );
}
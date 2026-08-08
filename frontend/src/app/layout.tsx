import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/lib/SessionContext";
import { LanguageProvider } from "@/lib/LanguageContext";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  title: "Symmetrics — Statistik Skripsi Kesehatan",
  description: "Aplikasi statistik AI untuk skripsi mahasiswa kesehatan.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={`h-full antialiased ${nunito.variable}`}>
      <body className="min-h-full bg-duo-bg text-duo-gray">
        <LanguageProvider>
          <SessionProvider>
            <div className="flex min-h-screen flex-col md:flex-row">
              <NavBar />
              <div className="flex flex-1 flex-col">
                <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-8">{children}</main>
                <Footer />
              </div>
            </div>
          </SessionProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}

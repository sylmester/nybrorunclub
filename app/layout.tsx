import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./Providers";
import Nav from "./components/Nav";
import Footer from "./components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Nybrogård Løbeklub",
  description: "Race results and timing for Nybrogård Løbeklub",
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="da">
      <body className={inter.className}>
        <Providers>
          <Nav />
          <div className="min-h-screen">{children}</div>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}

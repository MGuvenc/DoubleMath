import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const SITE_NAME = "Matematik Özel Ders";
const SITE_DESCRIPTION =
  "Deneyimli matematik öğretmeninden birebir online özel ders. LGS, YKS ve okul müfredatına yönelik profesyonel matematik desteği.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: `${SITE_NAME} | Online Birebir Matematik Dersi`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "matematik özel ders",
    "online matematik dersi",
    "LGS matematik",
    "YKS matematik",
    "özel matematik öğretmeni",
  ],
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: SITE_NAME,
    title: `${SITE_NAME} | Online Birebir Matematik Dersi`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className={inter.variable}>
      <body className="font-sans antialiased text-slate-900 bg-white">
        {children}
      </body>
    </html>
  );
}

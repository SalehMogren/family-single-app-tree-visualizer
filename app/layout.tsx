import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../styles/globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "شجرة العائلة - Family Tree",
  description: "تطبيق شجرة العائلة التفاعلي",
  generator: "v0.dev",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='ar' dir='rtl'>
      <head>
        <link
          href='https://fonts.googleapis.com/css2?family=Raqaa+One&family=Amiri:wght@400;700&family=Noto+Sans+Arabic:wght@400;500;600;700&display=swap'
          rel='stylesheet'
        />
      </head>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

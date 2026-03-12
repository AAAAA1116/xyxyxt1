import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { SuppressAuthLockError } from "@/components/SuppressAuthLockError";

export const metadata: Metadata = {
  title: "校园二手",
  description: "校园二手交易平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="font-sans antialiased min-h-screen bg-gray-50">
        <SuppressAuthLockError />
        <Header />
        <main className="pb-20">{children}</main>
      </body>
    </html>
  );
}

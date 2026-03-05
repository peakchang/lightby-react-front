import type { Metadata } from "next";
// Geist 관련 import는 사용하지 않는다면 삭제해도 무방합니다.
import "./globals.css";

import AlertProvider from "@/components/AlertProvider";

export const metadata: Metadata = {
  title: "번개분양",
  description: "빠르고 정확한 분양 정보",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="font-sans antialiased">
        {children}
        <AlertProvider />
      </body>
    </html>
  );
}
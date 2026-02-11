import type { Metadata, Viewport } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "애기 이름짓기 — AI가 추천하는 아기 이름",
  description: "사주 기반 AI 작명 서비스. 음양오행, 획수 분석, 한자 의미까지 고려한 완벽한 이름을 추천합니다.",
  openGraph: {
    title: "애기 이름짓기 — AI가 추천하는 아기 이름",
    description: "사주 기반 AI 작명 서비스. 음양오행, 획수 분석, 한자 의미까지 완전 무료",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#FAFBFC",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="min-h-screen flex flex-col bg-[var(--background)]">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

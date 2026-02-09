import type { Metadata, Viewport } from "next";
import "./globals.css";
import ClientLayout from "@/components/layout/ClientLayout";

export const metadata: Metadata = {
  title: "AI작명소 — AI가 추천하는 아기 이름",
  description: "사주 기반 AI 작명 서비스. 음양오행, 획수 분석, 한자 의미까지 고려한 완벽한 이름을 추천합니다.",
  openGraph: {
    title: "AI작명소 — AI가 추천하는 아기 이름",
    description: "사주 기반 AI 작명 서비스. 음양오행, 획수 분석, 한자 의미까지 ₩990",
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
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}

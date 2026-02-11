import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import QueryProvider from "@/components/QueryProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ✅ 배포/로컬 모두 안정적으로 동작하게 "확정 URL" 사용
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "BandMeet",
    template: "%s | BandMeet",
  },
  description: "밴드 일정 관리 플랫폼",

  openGraph: {
    title: "BandMeet",
    description: "밴드 일정 관리 플랫폼",
    url: siteUrl,
    siteName: "BandMeet",
    images: [
      {
        // ✅ metadataBase가 있으므로 상대경로 OK (절대경로로 자동 변환됨)
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "BandMeet 썸네일",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "BandMeet",
    description: "밴드 일정 관리 플랫폼",
    images: [`${siteUrl}/og-image.png`],
  },

  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}

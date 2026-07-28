import type { Metadata, Viewport } from "next";
import "./globals.css";
import {AuthProvider} from "../components/auth/AuthProvider";

export const metadata: Metadata = {
  title: "EYRIA — Personal AI Travel Companion",
  description: "Personal AI Travel Companion. EYRIA가 당신의 취향과 동선을 분석하여 완벽한 여행 일정을 인공지능으로 자동 생성합니다.",
  openGraph: {
    title: "EYRIA — Personal AI Travel Companion",
    description: "Global AI Travel Planner & Personal Companion",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "EYRIA — Personal AI Travel Companion",
    description: "Global AI Travel Planner & Personal Companion",
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body><AuthProvider>{children}</AuthProvider></body></html>;
}

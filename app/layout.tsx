import type { Metadata, Viewport } from "next";
import "./globals.css";
import {AuthProvider} from "../components/auth/AuthProvider";

export const metadata: Metadata = {
  title: "PLANIT — 여행의 시작",
  description: "목적지를 고르면 AI가 나만의 여행 일정을 설계합니다.",
  openGraph: { title: "PLANIT", description: "여행의 시작을 더 가볍게", images: ["/og.png"] },
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

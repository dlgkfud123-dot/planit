import type { Metadata } from "next";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function PlannerLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}

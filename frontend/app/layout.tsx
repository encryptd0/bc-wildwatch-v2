import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BC WildWatch",
  description: "Campus wildlife and danger reporting with severity-based escalation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

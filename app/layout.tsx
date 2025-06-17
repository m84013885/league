import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "养生联盟",
  description: "养生联盟数据统计",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

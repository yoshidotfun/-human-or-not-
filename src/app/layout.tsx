import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { MiniKitProvider } from "@worldcoin/minikit-js/minikit-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Human or Not? — World ID Game",
  description: "チャット相手は人間？それともBot？World IDで本物の人間を証明しよう",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <MiniKitProvider props={{ appId: process.env.NEXT_PUBLIC_WLD_APP_ID }}>
          {children}
        </MiniKitProvider>
      </body>
    </html>
  );
}

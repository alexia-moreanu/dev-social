import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import SideNav from "@/components/nav/SideNav";
import MobileTopBar from "@/components/nav/MobileTopBar";
import BottomNav from "@/components/nav/BottomNav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "dev/social",
  description: "Social media for developers — projects, snippets, tips, reels, and news in one place.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full">
        <div className="flex min-h-full">
          <SideNav />
          <div className="flex-1 min-w-0 flex flex-col">
            <MobileTopBar />
            <main className="flex-1 pb-16 md:pb-0">{children}</main>
          </div>
        </div>
        <BottomNav />
      </body>
    </html>
  );
}

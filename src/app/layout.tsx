import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { QueryProvider } from "@/components/shared/QueryProvider";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Knit Manager",
  description: "뜨개 공방 전용 CRM - 로트 기반 재고 + 수강생 관리",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <QueryProvider>
            {children}
            <Toaster richColors position="top-right" />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./global.css";
import { PushProvider } from "@/components/providers/push-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
 title: "Hamun",
 description: "Hamun - CRM, Todo, Habits & Journal",
 manifest: "/manifest.json",
};

export const viewport: Viewport = {
 themeColor: "#7c3aed",
 width: "device-width",
 initialScale: 1,
 maximumScale: 1,
};

export default function RootLayout({
 children,
}: Readonly<{
 children: React.ReactNode;
}>) {
 return (
 <html lang="en" suppressHydrationWarning>
 <head>
 <link rel="manifest" href="/manifest.json" />
 </head>
 <body className={inter.className}>
 <ThemeProvider>
 <PushProvider>
 {children}
 </PushProvider>
 <Toaster position="top-center" />
 </ThemeProvider>
 </body>
 </html>
 );
}

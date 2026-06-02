import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { UsageProvider } from "@/contexts/UsageContext";
import { NavigationProgress } from "@/components/NavigationProgress";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Lucky Photo - Lunar New Year Template Generator",
    description: "Create personalized Lunar New Year images with AI-powered templates.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${inter.className} cny-gradient-bg min-h-screen`}>
                <NavigationProgress />
                <SessionProvider>
                    <AuthProvider>
                        <SubscriptionProvider>
                            <UsageProvider>
                                {children}
                            </UsageProvider>
                        </SubscriptionProvider>
                    </AuthProvider>
                </SessionProvider>
            </body>
        </html>
    );
}

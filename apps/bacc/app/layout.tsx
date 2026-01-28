import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "新年快乐 - AI Magic Studio for Lunar New Year",
    description: "Create stunning personalized Lunar New Year greetings with AI-powered Hanfu styling, festive backgrounds, and cinematic motion.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${inter.className} cny-gradient-bg min-h-screen`}>
                <AuthProvider>
                    <SubscriptionProvider>
                        {children}
                    </SubscriptionProvider>
                </AuthProvider>
            </body>
        </html>
    );
}


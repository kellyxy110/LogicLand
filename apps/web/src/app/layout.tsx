import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { APP_NAME, TAGLINE } from "@logicland/shared";
import "./globals.css";

export const metadata: Metadata = {
  title: `${APP_NAME} — ${TAGLINE}`,
  description: "A premium coding and computational-thinking world for children 5-10.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className="min-h-screen font-sans antialiased">{children}</body>
      </html>
    </ClerkProvider>
  );
}

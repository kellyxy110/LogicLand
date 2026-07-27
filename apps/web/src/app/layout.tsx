import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { APP_NAME, TAGLINE } from "@logicland/shared";
import { AppHeader } from "@/components/AppHeader";
import { MotionProvider } from "@/components/MotionProvider";
import { AgeModeProvider } from "@/features/age-mode/AgeModeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: `${APP_NAME} — ${TAGLINE}`,
  description: "A premium coding and computational-thinking world for children 5-10.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className="min-h-screen font-sans antialiased">
          <MotionProvider>
            <AgeModeProvider>
              <AppHeader />
              {children}
            </AgeModeProvider>
          </MotionProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}

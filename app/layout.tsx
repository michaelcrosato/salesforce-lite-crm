import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { CommandPalette } from "@/components/command-palette";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: {
    default: "Salesforce Lite CRM",
    template: "%s | Salesforce Lite CRM"
  },
  description:
    "Salesforce-style CRM application foundation for small business revenue operations.",
  robots: {
    index: false,
    follow: false
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <AppShell>{children}</AppShell>
          <CommandPalette />
        </ToastProvider>
      </body>
    </html>
  );
}

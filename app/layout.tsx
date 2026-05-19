import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { CommandPalette } from "@/components/command-palette";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "Salesforce Lite CRM",
  description:
    "Salesforce-style CRM application foundation for small business revenue operations."
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

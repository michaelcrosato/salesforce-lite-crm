import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "Salesforce Lite CRM",
  description: "Local-first CRM foundation for small business revenue workflows."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <AppShell>{children}</AppShell>
        </ToastProvider>
      </body>
    </html>
  );
}

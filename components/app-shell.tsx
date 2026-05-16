import { Search } from "lucide-react";
import Link from "next/link";
import { SidebarNav } from "@/components/sidebar-nav";
import { Input } from "@/components/ui/input";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-card lg:block">
          <div className="flex h-16 items-center border-b px-6">
            <Link href="/dashboard" className="flex flex-col">
              <span className="text-sm font-semibold uppercase tracking-normal text-primary">
                Salesforce Lite
              </span>
              <span className="text-xs text-muted-foreground">Executive CRM</span>
            </Link>
          </div>
          <SidebarNav />
        </aside>
        <div className="flex min-h-screen flex-1 flex-col lg:pl-64">
          <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
            <div className="flex h-16 items-center gap-4 px-4 sm:px-6 lg:px-8">
              <div className="lg:hidden">
                <Link href="/dashboard" className="text-sm font-semibold text-primary">
                  Salesforce Lite
                </Link>
              </div>
              <form
                action="/contacts"
                className="relative ml-auto w-full max-w-xl"
                role="search"
              >
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  name="q"
                  placeholder="Search contacts, accounts, or deals"
                  className="pl-9"
                />
              </form>
            </div>
            <div className="border-t bg-card lg:hidden">
              <SidebarNav mobile />
            </div>
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}

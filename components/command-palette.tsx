"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition
} from "react";
import { Input } from "@/components/ui/input";
import {
  searchCrmAction,
  type CrmSearchResults
} from "@/components/command-palette-action";

const EMPTY_RESULTS: CrmSearchResults = {
  accounts: [],
  contacts: [],
  opportunities: [],
  leads: [],
  tasks: [],
  cases: [],
  campaigns: []
};

type Group = {
  key: keyof CrmSearchResults;
  label: string;
};

const GROUPS: readonly Group[] = [
  { key: "accounts", label: "Accounts" },
  { key: "contacts", label: "Contacts" },
  { key: "opportunities", label: "Deals" },
  { key: "leads", label: "Leads" },
  { key: "tasks", label: "Tasks" },
  { key: "cases", label: "Cases" },
  { key: "campaigns", label: "Campaigns" }
];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CrmSearchResults>(EMPTY_RESULTS);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setResults(EMPTY_RESULTS);
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const isMod = event.metaKey || event.ctrlKey;
      if (isMod && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
        return;
      }
      if (event.key === "Escape" && open) {
        event.preventDefault();
        close();
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const handle = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 30);
    return () => window.clearTimeout(handle);
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const trimmed = query.trim();
    if (trimmed.length === 0) {
      setResults(EMPTY_RESULTS);
      return;
    }

    const handle = window.setTimeout(() => {
      startTransition(() => {
        void (async () => {
          const next = await searchCrmAction(trimmed);
          setResults(next);
        })();
      });
    }, 120);

    return () => window.clearTimeout(handle);
  }, [query, open]);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setQuery(event.currentTarget.value);
  }

  function navigate(route: string) {
    close();
    router.push(route);
  }

  if (!open) {
    return null;
  }

  const totalResults = GROUPS.reduce(
    (sum, group) => sum + results[group.key].length,
    0
  );

  return (
    <div className="fixed inset-0 z-[70]">
      <button
        type="button"
        aria-label="Close command palette"
        className="absolute inset-0 bg-slate-950/40"
        onClick={close}
      />
      <div className="relative mx-auto mt-24 w-[min(640px,calc(100vw-2rem))] rounded-lg border bg-background shadow-2xl">
        <div className="flex items-center gap-3 border-b p-3">
          <Search className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input
            ref={inputRef}
            value={query}
            onChange={handleChange}
            placeholder="Search accounts, contacts, deals, tasks…"
            aria-label="Search CRM"
            className="h-9 border-0 bg-transparent shadow-none focus-visible:ring-0"
          />
          <kbd className="hidden rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground sm:inline">
            Esc
          </kbd>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {query.trim().length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              Type to search across accounts, contacts, deals, leads, tasks, cases, and campaigns.
            </p>
          ) : isPending && totalResults === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">Searching…</p>
          ) : totalResults === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">No matches.</p>
          ) : (
            GROUPS.map((group) => {
              const items = results[group.key];
              if (items.length === 0) {
                return null;
              }
              return (
                <div key={group.key} className="mb-2 last:mb-0">
                  <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {group.label}
                  </p>
                  <ul>
                    {items.map((item) => (
                      <li key={`${group.key}-${item.id}`}>
                        <Link
                          href={item.route}
                          onClick={(event) => {
                            event.preventDefault();
                            navigate(item.route);
                          }}
                          className="flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-muted"
                        >
                          <span>{item.label}</span>
                          <span className="text-xs text-muted-foreground">{group.label}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

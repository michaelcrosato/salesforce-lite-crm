"use client";

import { useState, useTransition } from "react";
import { ChevronUp, UserCheck, ShieldAlert, Sparkles } from "lucide-react";
import { setCurrentUserAction } from "@/lib/session-actions";
import { cn } from "@/lib/utils";

type UserOption = {
  id: string;
  name: string;
  email: string;
  role: string;
};

interface SessionSwitcherClientProps {
  users: UserOption[];
  currentUser: UserOption | null;
}

export function SessionSwitcherClient({ users, currentUser }: SessionSwitcherClientProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleUserSelect = (userId: string) => {
    setIsOpen(false);
    startTransition(async () => {
      await setCurrentUserAction(userId);
    });
  };

  if (!currentUser) {
    return (
      <div className="p-4 mx-3 my-4 bg-destructive/10 text-destructive text-xs rounded-lg flex items-center gap-2 border border-destructive/20">
        <ShieldAlert className="h-4 w-4 shrink-0" />
        <span>Mock session error: default user missing in database.</span>
      </div>
    );
  }

  return (
    <div className="relative border-t bg-muted/30 px-4 py-3 select-none flex flex-col gap-2 font-sans">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase text-muted-foreground">
          <Sparkles className="h-3 w-3 text-amber-500 animate-pulse" />
          <span>Dev Identity Harness</span>
        </div>
        {isPending && (
          <div className="h-3 w-3 animate-spin rounded-full border border-primary border-t-transparent" />
        )}
      </div>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full text-left flex items-center justify-between rounded-lg border bg-card p-2.5 text-sm shadow-xs transition-all hover:bg-accent/50 hover:translate-y-[-1px] active:translate-y-[1px]",
          isOpen ? "ring-2 ring-primary/20 border-primary" : "border-input"
        )}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        disabled={isPending}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-foreground truncate">{currentUser.name}</span>
            <span
              className={cn(
                "inline-flex items-center rounded-sm px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                currentUser.role === "manager"
                  ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                  : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
              )}
            >
              {currentUser.role}
            </span>
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">{currentUser.email}</p>
        </div>
        <ChevronUp
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform shrink-0 ml-2 duration-200",
            isOpen ? "transform rotate-180" : ""
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute bottom-[105%] left-4 right-4 z-50 rounded-xl border bg-popover p-1.5 shadow-lg animate-in slide-in-from-bottom-2 fade-in duration-200">
          <div className="px-2.5 py-1 text-[9px] font-bold text-muted-foreground uppercase tracking-wider border-b pb-1.5 mb-1">
            Switch mock account
          </div>
          <div role="listbox" className="flex flex-col gap-0.5 max-h-48 overflow-y-auto">
            {users.map((user) => {
              const isActive = user.id === currentUser.id;
              return (
                <button
                  key={user.id}
                  role="option"
                  aria-selected={isActive}
                  onClick={() => handleUserSelect(user.id)}
                  className={cn(
                    "w-full text-left flex items-center justify-between rounded-lg px-2.5 py-2 text-xs transition-colors hover:bg-accent hover:text-accent-foreground",
                    isActive ? "bg-accent/80 text-accent-foreground font-medium" : "text-muted-foreground"
                  )}
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-foreground truncate">{user.name}</span>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-sm px-1 py-0.2 text-[8px] font-extrabold uppercase tracking-wider",
                          user.role === "manager"
                            ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        )}
                      >
                        {user.role}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">{user.email}</p>
                  </div>
                  {isActive && <UserCheck className="h-4 w-4 text-primary shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

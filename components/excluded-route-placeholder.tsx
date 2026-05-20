import { AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ExcludedRoutePlaceholderProps {
  route: string;
  reason?: string;
}

export function ExcludedRoutePlaceholder({
  route,
  reason
}: ExcludedRoutePlaceholderProps) {
  return (
    <Card className="border-dashed border-amber-200 bg-amber-50/50">
      <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
        <div className="rounded-full bg-amber-100 p-3 text-amber-600">
          <AlertTriangle className="h-6 w-6" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <p className="font-semibold text-amber-900">
            This module is not part of the demo
          </p>
          <p className="text-sm text-amber-800">
            Route:{" "}
            <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-amber-900">
              {route}
            </code>
          </p>
          {reason ? <p className="text-sm text-amber-700">{reason}</p> : null}
        </div>
        <p className="text-xs text-amber-600">
          See{" "}
          <a
            href="https://github.com/michaelcrosato/salesforce-lite-crm/blob/main/CRM-CONTRACT.md"
            className="underline hover:text-amber-800"
            target="_blank"
            rel="noopener noreferrer"
          >
            CRM-CONTRACT.md
          </a>{" "}
          for the supported feature set.
        </p>
      </CardContent>
    </Card>
  );
}

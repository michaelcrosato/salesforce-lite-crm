"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ActivityTimeline, type TimelineActivity } from "@/components/activity-timeline";
import { AuditHistoryPanel, type HistoryEvent } from "@/components/audit-history-panel";

interface DetailTimelineTabsProps {
  activities: TimelineActivity[];
  auditEvents: HistoryEvent[];
  entityType: string;
}

export function DetailTimelineTabs({
  activities,
  auditEvents,
  entityType
}: DetailTimelineTabsProps) {
  const [activeTab, setActiveTab] = useState<"activities" | "history">("activities");

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setActiveTab("activities")}
            className={`text-sm font-semibold pb-2 border-b-2 transition-all ${
              activeTab === "activities"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            data-testid={`${entityType}-activities-tab`}
          >
            Activity Timeline
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`text-sm font-semibold pb-2 border-b-2 transition-all ${
              activeTab === "history"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            data-testid={`${entityType}-history-tab`}
          >
            System Change History
          </button>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {activeTab === "activities" ? (
          <ActivityTimeline activities={activities} />
        ) : (
          <AuditHistoryPanel events={auditEvents} data-testid={`${entityType}-history-panel`} />
        )}
      </CardContent>
    </Card>
  );
}

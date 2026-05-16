import Link from "next/link";
import { ActivityTimeline } from "@/components/activity-timeline";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { ACTIVITY_TYPES, ACTIVITY_TYPE_LABELS, type ActivityType } from "@/lib/crm-constants";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ActivitiesPage({
  searchParams
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const filter = ACTIVITY_TYPES.includes(resolvedSearchParams.type as ActivityType)
    ? (resolvedSearchParams.type as ActivityType)
    : "all";
  const activities = await prisma.activity.findMany({
    where:
      filter !== "all"
        ? {
            type: filter
          }
        : undefined,
    orderBy: {
      createdAt: "desc"
    },
    take: 60,
    include: {
      account: {
        select: {
          id: true,
          name: true
        }
      },
      contact: {
        select: {
          id: true,
          firstName: true,
          lastName: true
        }
      },
      deal: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  return (
    <div className="crm-page">
      <PageHeader
        title="Activities"
        description="Recent notes, calls, emails, meetings, and pipeline changes across the CRM."
      />

      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Activity Feed</CardTitle>
            <div className="mt-2 flex flex-wrap gap-2">
              <Link href="/activities">
                <Badge variant={filter === "all" ? "default" : "outline"}>All</Badge>
              </Link>
              {ACTIVITY_TYPES.map((type) => (
                <Link key={type} href={`/activities?type=${type}`}>
                  <Badge variant={filter === type ? "default" : "outline"}>
                    {ACTIVITY_TYPE_LABELS[type]}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
          <form action="/activities" className="grid w-full gap-2 sm:max-w-sm sm:grid-cols-[1fr_auto]">
            <Select name="type" defaultValue={filter}>
              <option value="all">All activity</option>
              {ACTIVITY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {ACTIVITY_TYPE_LABELS[type]}
                </option>
              ))}
            </Select>
            <Button type="submit" variant="secondary">
              Apply
            </Button>
          </form>
        </CardHeader>
        <CardContent>
          <ActivityTimeline activities={activities} />
        </CardContent>
      </Card>
    </div>
  );
}

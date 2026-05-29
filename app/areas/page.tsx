import type { Metadata } from "next";
import Link from "next/link";
import { ListSelectedExportAction } from "@/components/list-selected-export-action";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";



export const metadata: Metadata = {
  title: "Areas"
};

export default async function AreasPage() {
  const areas = await prisma.area.findMany({
    orderBy: [
      {
        province: "asc"
      },
      {
        name: "asc"
      }
    ],
    include: {
      dealerOrders: {
        select: {
          dealerOrder: {
            select: {
              id: true,
              name: true,
              status: true
            }
          }
        }
      }
    }
  });

  return (
    <div className="crm-page">
      <PageHeader
        title="Areas"
        description="Postal prefix coverage used by the deterministic dealer lead router."
      />

      <Card>
        <CardHeader>
          <CardTitle>Routing Areas</CardTitle>
        </CardHeader>
        <CardContent>
          {areas.length > 0 ? (
            <div className="overflow-x-auto">
              <ListSelectedExportAction
                entity="areas"
                entityLabel="Areas"
                records={areas.map((area) => ({
                  id: area.id,
                  label: area.name
                }))}
              />
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                    <th className="py-3 pr-4 font-medium">Area</th>
                    <th className="py-3 pr-4 font-medium">Province</th>
                    <th className="py-3 pr-4 font-medium">Region</th>
                    <th className="py-3 pr-4 font-medium">Postal prefixes</th>
                    <th className="py-3 pr-4 font-medium">Linked orders</th>
                  </tr>
                </thead>
                <tbody>
                  {areas.map((area) => (
                    <tr key={area.id} className="border-b last:border-0">
                      <td className="py-3 pr-4 font-medium">{area.name}</td>
                      <td className="py-3 pr-4">
                        {area.province ?? "No province"}
                      </td>
                      <td className="py-3 pr-4">
                        {area.region ?? "No region"}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex flex-wrap gap-1">
                          {area.postalPrefixes.split(",").map((prefix) => (
                            <Badge key={prefix} variant="secondary">
                              {prefix.trim()}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-muted-foreground">
                            {area.dealerOrders.length} linked
                          </span>
                          {area.dealerOrders.slice(0, 3).map((link) => (
                            <Link
                              key={link.dealerOrder.id}
                              href={`/orders/${link.dealerOrder.id}`}
                              className="text-primary hover:underline"
                            >
                              {link.dealerOrder.name}
                            </Link>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="No areas"
              description="Seeded routing areas cover this surface; create and edit flows are deferred."
              actionHref="/dashboard"
              actionLabel="Return to dashboard"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

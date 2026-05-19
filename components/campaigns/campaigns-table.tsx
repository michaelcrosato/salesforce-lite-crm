"use client";

import { Eye } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { ROUTE_REGISTRY, type CampaignStatus } from "@/lib/crm/registry";
import { formatCurrency, formatDate } from "@/lib/formatters";

type BadgeVariant =
  | "default"
  | "secondary"
  | "outline"
  | "success"
  | "warning"
  | "danger";

export type CampaignRow = {
  id: string;
  name: string;
  status: CampaignStatus;
  startDate: string | null;
  endDate: string | null;
  budget: number | null;
  owner: { id: string; name: string } | null;
};

const STATUS_LABELS: Record<CampaignStatus, string> = {
  planned: "Planned",
  active: "Active",
  completed: "Completed",
  cancelled: "Cancelled"
};

const STATUS_VARIANT: Record<CampaignStatus, BadgeVariant> = {
  planned: "secondary",
  active: "default",
  completed: "success",
  cancelled: "outline"
};

export function CampaignsTable({ campaigns }: { campaigns: CampaignRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Start date</TableHead>
          <TableHead>End date</TableHead>
          <TableHead>Budget</TableHead>
          <TableHead>Owner</TableHead>
          <TableHead className="w-16">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {campaigns.map((campaign) => (
          <TableRow key={campaign.id}>
            <TableCell className="font-medium">
              <Link
                href={ROUTE_REGISTRY.campaignDetail(campaign.id)}
                className="text-primary hover:underline"
              >
                {campaign.name}
              </Link>
            </TableCell>
            <TableCell>
              <Badge variant={STATUS_VARIANT[campaign.status]}>
                {STATUS_LABELS[campaign.status]}
              </Badge>
            </TableCell>
            <TableCell>{formatDate(campaign.startDate)}</TableCell>
            <TableCell>{formatDate(campaign.endDate)}</TableCell>
            <TableCell>
              {typeof campaign.budget === "number"
                ? formatCurrency(campaign.budget)
                : "—"}
            </TableCell>
            <TableCell>{campaign.owner?.name ?? "Unassigned"}</TableCell>
            <TableCell>
              <Button asChild variant="ghost" size="icon">
                <Link
                  href={ROUTE_REGISTRY.campaignDetail(campaign.id)}
                  aria-label="Open campaign"
                >
                  <Eye className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

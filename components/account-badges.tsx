import { Badge } from "@/components/ui/badge";

export function AccountStatusBadge({ status }: { status: string }) {
  if (status === "active") {
    return <Badge variant="success">Active</Badge>;
  }

  if (status === "paused") {
    return <Badge variant="warning">Paused</Badge>;
  }

  return <Badge variant="danger">Churned</Badge>;
}

export function HealthBadge({ value }: { value: number }) {
  if (value >= 75) {
    return <Badge variant="success">{value}</Badge>;
  }

  if (value >= 55) {
    return <Badge variant="warning">{value}</Badge>;
  }

  return <Badge variant="danger">{value}</Badge>;
}

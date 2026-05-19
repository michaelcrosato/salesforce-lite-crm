export type ForecastRisk = "miss" | "hit" | "over";

export type ForecastOrder = {
  id: string;
  name: string;
  monthlyQuota: number;
  deliveredThisMonth: number;
  account: {
    id: string;
    name: string;
  };
  areas: Array<{
    id: string;
    name: string;
  }>;
};

export type ForecastInput = {
  orders: ForecastOrder[];
  leadVolumeMultiplier: number;
  assignmentRate: number;
  now?: Date;
  areaId?: string;
};

export type ForecastRow = {
  orderId: string;
  orderName: string;
  accountId: string;
  accountName: string;
  areas: string[];
  currentDelivered: number;
  monthlyQuota: number;
  projectedDelivered: number;
  risk: ForecastRisk;
  additionalLeadsNeeded: number;
};

export type ForecastSummary = {
  projectedLeads: number;
  ordersLikelyToHitQuota: number;
  ordersLikelyToMissQuota: number;
  ordersLikelyToOverDeliver: number;
};

export type ForecastResult = {
  summary: ForecastSummary;
  rows: ForecastRow[];
};

const defaultLeadVolumeMultiplier = 1;
const defaultAssignmentRate = 0.75;

export function clampLeadVolumeMultiplier(value: number) {
  const finiteValue = Number.isFinite(value) ? value : defaultLeadVolumeMultiplier;
  return Math.min(3, Math.max(0.5, finiteValue));
}

export function clampAssignmentRate(value: number) {
  const finiteValue = Number.isFinite(value) ? value : defaultAssignmentRate;
  return Math.min(1, Math.max(0.1, finiteValue));
}

export function calculateDefaultAssignmentRate(input: {
  totalLeads: number;
  routedLeads: number;
}) {
  if (!Number.isFinite(input.totalLeads) || !Number.isFinite(input.routedLeads)) {
    return defaultAssignmentRate;
  }

  if (input.totalLeads <= 0) {
    return defaultAssignmentRate;
  }

  return clampAssignmentRate(input.routedLeads / input.totalLeads);
}

export function buildForecast(input: ForecastInput): ForecastResult {
  const now = input.now ?? new Date();
  const leadVolumeMultiplier = clampLeadVolumeMultiplier(input.leadVolumeMultiplier);
  const assignmentRate = clampAssignmentRate(input.assignmentRate);
  const elapsedDays = Math.max(1, now.getDate());
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const orders = input.areaId
    ? input.orders.filter((order) => order.areas.some((area) => area.id === input.areaId))
    : input.orders;

  const rows = orders.map((order) => {
    const currentRunRate = order.deliveredThisMonth / elapsedDays;
    const projectedDelivered = Math.round(
      currentRunRate * daysInMonth * leadVolumeMultiplier * assignmentRate
    );
    const risk = forecastRisk(projectedDelivered, order.monthlyQuota);

    return {
      orderId: order.id,
      orderName: order.name,
      accountId: order.account.id,
      accountName: order.account.name,
      areas: order.areas.map((area) => area.name),
      currentDelivered: order.deliveredThisMonth,
      monthlyQuota: order.monthlyQuota,
      projectedDelivered,
      risk,
      additionalLeadsNeeded: Math.max(0, order.monthlyQuota - projectedDelivered)
    };
  });

  return {
    summary: {
      projectedLeads: rows.reduce((total, row) => total + row.projectedDelivered, 0),
      ordersLikelyToHitQuota: rows.filter((row) => row.risk === "hit").length,
      ordersLikelyToMissQuota: rows.filter((row) => row.risk === "miss").length,
      ordersLikelyToOverDeliver: rows.filter((row) => row.risk === "over").length
    },
    rows
  };
}

function forecastRisk(projectedDelivered: number, monthlyQuota: number): ForecastRisk {
  if (projectedDelivered < monthlyQuota) {
    return "miss";
  }

  if (projectedDelivered > monthlyQuota * 1.1) {
    return "over";
  }

  return "hit";
}

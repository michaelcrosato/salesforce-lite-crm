import {
  DEAL_STAGES,
  OPEN_DEAL_STAGES,
  type DealStage
} from "@/lib/crm-constants";
import { dealStageSchema } from "@/lib/validation";

export type ForecastDeal = {
  stage: string;
  value: number;
  probability: number;
};

export type StaleDealCandidate = {
  stage: string;
  createdAt: Date | string;
  lastActivityAt: Date | string | null;
};

export function isOpenDealStage(stage: string) {
  return OPEN_DEAL_STAGES.includes(stage as DealStage);
}

export function probabilityForStage(stage: string) {
  const parsed = dealStageSchema.parse(stage);

  const probabilities: Record<DealStage, number> = {
    new: 10,
    qualified: 25,
    proposal: 50,
    negotiation: 75,
    won: 100,
    lost: 0
  };

  return probabilities[parsed];
}

export function calculateWeightedForecast(deals: ForecastDeal[]) {
  return deals
    .filter((deal) => isOpenDealStage(deal.stage))
    .reduce((total, deal) => total + deal.value * (deal.probability / 100), 0);
}

export function isStaleDeal(
  deal: StaleDealCandidate,
  now = new Date(),
  staleAfterDays = 14
) {
  if (!isOpenDealStage(deal.stage)) {
    return false;
  }

  const activityDate = deal.lastActivityAt ?? deal.createdAt;
  const ageInMs = now.getTime() - new Date(activityDate).getTime();
  const ageInDays = Math.floor(ageInMs / 86_400_000);

  return ageInDays >= staleAfterDays;
}

export function stageSortIndex(stage: string) {
  const index = DEAL_STAGES.findIndex((dealStage) => dealStage === stage);
  return index === -1 ? DEAL_STAGES.length : index;
}

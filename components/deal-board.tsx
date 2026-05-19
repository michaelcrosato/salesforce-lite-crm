"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { moveDealAction } from "@/app/deals/actions";
import {
  DealDetailDrawer,
  type DrawerDeal
} from "@/components/deal-detail-drawer";
import type {
  DealAccountOption,
  DealContactOption,
  DealOwnerOption
} from "@/components/deal-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { DEAL_STAGES, STAGE_LABELS, type DealStage } from "@/lib/crm-constants";
import {
  formatCurrency,
  formatDate,
  formatPercent,
  formatRelativeDays
} from "@/lib/formatters";

export type BoardDeal = DrawerDeal;

export function DealBoard({
  deals,
  highlightedDealId,
  accounts,
  contacts,
  owners
}: {
  deals: BoardDeal[];
  highlightedDealId?: string;
  accounts: DealAccountOption[];
  contacts: DealContactOption[];
  owners: DealOwnerOption[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [selectedDealId, setSelectedDealId] = useState<string | null>(
    highlightedDealId ?? null
  );
  const [draggingDealId, setDraggingDealId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const selectedDeal = deals.find((deal) => deal.id === selectedDealId) ?? null;

  function moveDeal(stage: DealStage, dealId: string | null) {
    if (!dealId) {
      return;
    }

    setDraggingDealId(null);
    startTransition(() => {
      void (async () => {
        const result = await moveDealAction({ dealId, stage });
        showToast({
          title: result.ok ? "Deal moved" : "Deal not moved",
          description: result.message,
          variant: result.ok ? "success" : "error"
        });
        router.refresh();
      })();
    });
  }

  return (
    <div className="space-y-3">
      <div className="min-h-5 text-sm text-muted-foreground">
        {isPending ? "Updating pipeline..." : null}
      </div>
      <div className="grid gap-4 xl:grid-cols-6">
        {DEAL_STAGES.map((stage) => {
          const stageDeals = deals.filter((deal) => deal.stage === stage);
          const total = stageDeals.reduce((sum, deal) => sum + deal.value, 0);

          return (
            <section
              key={stage}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                moveDeal(
                  stage,
                  event.dataTransfer.getData("text/plain") || draggingDealId
                );
              }}
              className="min-h-[520px] rounded-lg border bg-muted/40 p-3"
              data-stage={stage}
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold">
                    {STAGE_LABELS[stage]}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(total)}
                  </p>
                </div>
                <Badge variant="outline">{stageDeals.length}</Badge>
              </div>
              <div className="space-y-3">
                {stageDeals.length > 0 ? (
                  stageDeals.map((deal) => (
                    <Card
                      key={deal.id}
                      draggable
                      role="button"
                      tabIndex={0}
                      onDragStart={(event) => {
                        event.dataTransfer.setData("text/plain", deal.id);
                        setDraggingDealId(deal.id);
                      }}
                      onDragEnd={() => setDraggingDealId(null)}
                      onClick={() => setSelectedDealId(deal.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedDealId(deal.id);
                        }
                      }}
                      className={
                        highlightedDealId === deal.id
                          ? "cursor-grab border-primary ring-2 ring-primary/30"
                          : "cursor-grab"
                      }
                      data-deal-id={deal.id}
                    >
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="line-clamp-2 text-sm">
                          {deal.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 p-4 pt-0">
                        <div className="space-y-1 text-xs text-muted-foreground">
                          {deal.account ? (
                            <Link
                              href={`/accounts/${deal.account.id}`}
                              className="block text-primary hover:underline"
                              onClick={(event) => event.stopPropagation()}
                            >
                              {deal.account.name}
                            </Link>
                          ) : (
                            <span>No account</span>
                          )}
                          {deal.contact ? (
                            <Link
                              href={`/contacts/${deal.contact.id}`}
                              className="block hover:text-primary"
                              onClick={(event) => event.stopPropagation()}
                            >
                              {deal.contact.firstName} {deal.contact.lastName}
                            </Link>
                          ) : (
                            <span className="block">No contact</span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-muted-foreground">Value</p>
                            <p className="font-semibold">
                              {formatCurrency(deal.value)}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Probability</p>
                            <p className="font-semibold">
                              {formatPercent(deal.probability)}
                            </p>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Close: {formatDate(deal.expectedCloseDate)}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {deal.stale ? (
                            <Badge variant="danger">Stale</Badge>
                          ) : null}
                          <Badge variant="secondary">
                            {formatRelativeDays(
                              deal.lastActivityAt ?? deal.createdAt
                            )}
                          </Badge>
                        </div>
                        <Select
                          aria-label={`Move ${deal.name} stage`}
                          className="h-8 text-xs"
                          defaultValue={deal.stage}
                          disabled={isPending}
                          onClick={(event) => event.stopPropagation()}
                          onChange={(event) =>
                            moveDeal(
                              event.currentTarget.value as DealStage,
                              deal.id
                            )
                          }
                        >
                          {DEAL_STAGES.map((dealStage) => (
                            <option key={dealStage} value={dealStage}>
                              {STAGE_LABELS[dealStage]}
                            </option>
                          ))}
                        </Select>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="rounded-md border border-dashed bg-background p-4 text-center text-xs text-muted-foreground">
                    No deals in this stage.
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
      <DealDetailDrawer
        deal={selectedDeal}
        accounts={accounts}
        contacts={contacts}
        owners={owners}
        onClose={() => setSelectedDealId(null)}
      />
    </div>
  );
}

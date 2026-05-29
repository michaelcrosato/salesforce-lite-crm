import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { DealBoard, type BoardDeal } from "@/components/deal-board";
import { moveDealAction } from "@/app/deals/actions";
import type { ActionResult } from "@/lib/action-result";


// Mock server actions, navigation, and toast
vi.mock("@/app/deals/actions", () => ({
  moveDealAction: vi.fn(),
}));

const mockRouter = {
  push: vi.fn(),
  refresh: vi.fn(),
};

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  usePathname: () => "",
  useSearchParams: () => new URLSearchParams(),
}));

const mockShowToast = vi.fn();
vi.mock("@/components/ui/toast", () => ({
  useToast: () => ({
    showToast: mockShowToast,
  }),
}));

const mockDeal: BoardDeal = {
  id: "deal-1",
  name: "Acme Deal",
  stage: "qualified",
  value: 50000,
  probability: 20,
  expectedCloseDate: "2026-06-30T00:00:00.000Z",
  lastActivityAt: "2026-05-28T12:00:00.000Z",
  createdAt: "2026-05-20T08:00:00.000Z",
  updatedAt: "2026-05-28T12:00:00.000Z",
  stale: false,
  account: { id: "acc1", name: "Acme Corp" },
  contact: { id: "con1", firstName: "Jane", lastName: "Doe" },
  owner: { id: "owner1", name: "Sales Rep" },
  activities: [],
};

describe("DealBoard Component", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("renders the pipeline board and deals correctly", () => {
    render(
      <DealBoard
        deals={[mockDeal]}
        accounts={[]}
        contacts={[]}
        owners={[]}
      />
    );

    // Acme Deal appears multiple times (card title and export selected checklist label)
    expect(screen.getAllByText("Acme Deal")[0]).toBeInTheDocument();
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
  });

  it("applies stage change optimistically and then commits successfully", async () => {
    let resolveAction: (value: ActionResult) => void = () => {};
    const actionPromise = new Promise<ActionResult>((resolve) => {
      resolveAction = resolve;
    });
    vi.mocked(moveDealAction).mockReturnValue(actionPromise);

    render(
      <DealBoard
        deals={[mockDeal]}
        accounts={[]}
        contacts={[]}
        owners={[]}
      />
    );

    // Initial stage is qualified. Change it to proposal.
    const select = screen.getByLabelText("Move Acme Deal stage");
    expect(select).toHaveValue("qualified");

    await act(async () => {
      fireEvent.change(select, { target: { value: "proposal" } });
    });

    // Re-query the select in the new column/optimistic state
    const optimisticSelect = screen.getByLabelText("Move Acme Deal stage");
    expect(optimisticSelect).toHaveValue("proposal");

    // Resolve the server action with success
    await act(async () => {
      resolveAction({ ok: true, message: "Deal moved successfully" });
    });

    // Expect server action to have been called
    expect(moveDealAction).toHaveBeenCalledWith({
      dealId: "deal-1",
      stage: "proposal",
    });

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith({
        title: "Deal moved",
        description: "Deal moved successfully",
        variant: "success",
      });
      expect(mockRouter.refresh).toHaveBeenCalled();
    });
  });

  it("rolls back the stage change and displays error toast on server failure", async () => {
    let rejectAction: (value: ActionResult) => void = () => {};
    const actionPromise = new Promise<ActionResult>((resolve) => {
      rejectAction = resolve;
    });
    vi.mocked(moveDealAction).mockReturnValue(actionPromise);

    render(
      <DealBoard
        deals={[mockDeal]}
        accounts={[]}
        contacts={[]}
        owners={[]}
      />
    );

    const select = screen.getByLabelText("Move Acme Deal stage");
    expect(select).toHaveValue("qualified");

    await act(async () => {
      fireEvent.change(select, { target: { value: "proposal" } });
    });

    // Re-query the select in the new column/optimistic state
    const optimisticSelect = screen.getByLabelText("Move Acme Deal stage");
    expect(optimisticSelect).toHaveValue("proposal");

    // Resolve the server action with failure
    await act(async () => {
      rejectAction({ ok: false, message: "Failed to move deal due to connection error" });
    });

    // Explicitly wait for transition and state to flush
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    // Re-query select to assert rollback
    await waitFor(() => {
      const finalSelect = screen.getByLabelText("Move Acme Deal stage");
      expect(finalSelect).toHaveValue("qualified");
      expect(mockShowToast).toHaveBeenCalledWith({
        title: "Deal not moved",
        description: "Failed to move deal due to connection error",
        variant: "error",
      });
    });
  });
});

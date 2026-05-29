import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { DealDetailDrawer, type DrawerDeal } from "@/components/deal-detail-drawer";
import { moveDealAction, getAuditHistoryAction } from "@/app/deals/actions";

// Mock server actions and toast
vi.mock("@/app/deals/actions", () => ({
  moveDealAction: vi.fn(),
  getAuditHistoryAction: vi.fn(),
}));

const mockShowToast = vi.fn();
vi.mock("@/components/ui/toast", () => ({
  useToast: () => ({
    showToast: mockShowToast,
  }),
}));

const mockDeal: DrawerDeal = {
  id: "deal-123",
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

describe("DealDetailDrawer Component", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getAuditHistoryAction).mockResolvedValue({
      ok: true,
      events: [],
    });
  });

  it("returns null when deal is null", () => {
    const handleClose = vi.fn();
    const { container } = render(
      <DealDetailDrawer
        deal={null}
        accounts={[]}
        contacts={[]}
        owners={[]}
        onClose={handleClose}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders deal information correctly", async () => {
    const handleClose = vi.fn();
    render(
      <DealDetailDrawer
        deal={mockDeal}
        accounts={[]}
        contacts={[]}
        owners={[]}
        onClose={handleClose}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Acme Deal" })).toBeInTheDocument();
      expect(screen.getByText(/Acme Corp/)).toBeInTheDocument();
      expect(screen.getByText(/Jane.*Doe/)).toBeInTheDocument();
      expect(screen.getByText(/Owner.*Sales.*Rep/)).toBeInTheDocument();
    });
  });

  it("calls onClose when the close button is clicked", async () => {
    const handleClose = vi.fn();
    render(
      <DealDetailDrawer
        deal={mockDeal}
        accounts={[]}
        contacts={[]}
        owners={[]}
        onClose={handleClose}
      />
    );

    const closeBtn = await screen.findByLabelText("Close deal detail");
    await act(async () => {
      fireEvent.click(closeBtn);
    });

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("triggers moveDealAction when the stage selector is changed", async () => {
    vi.mocked(moveDealAction).mockResolvedValue({
      ok: true,
      message: "Deal successfully updated",
    });

    const handleClose = vi.fn();
    render(
      <DealDetailDrawer
        deal={mockDeal}
        accounts={[]}
        contacts={[]}
        owners={[]}
        onClose={handleClose}
      />
    );

    // Find the stage select
    const select = await screen.findByLabelText("Move Acme Deal stage from drawer");
    await act(async () => {
      fireEvent.change(select, { target: { value: "proposal" } });
    });

    await waitFor(() => {
      expect(moveDealAction).toHaveBeenCalledWith({
        dealId: "deal-123",
        stage: "proposal",
      });
      expect(mockShowToast).toHaveBeenCalledWith({
        title: "Deal moved",
        description: "Deal successfully updated",
        variant: "success",
      });
    });
  });
});

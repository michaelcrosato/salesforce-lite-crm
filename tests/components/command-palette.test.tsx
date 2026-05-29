import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { CommandPalette } from "@/components/command-palette";
import { searchCrmAction } from "@/components/command-palette-action";

// Mock the server action
vi.mock("@/components/command-palette-action", () => ({
  searchCrmAction: vi.fn(),
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

const mockResults = {
  accounts: [{ id: "acc1", label: "Acme Corp", route: "/accounts/acc1" }],
  contacts: [{ id: "con1", label: "John Doe", route: "/contacts/con1" }],
  opportunities: [{ id: "opp1", label: "Big Deal", route: "/deals/opp1" }],
  leads: [],
  tasks: [],
  cases: [],
  campaigns: [],
};

describe("CommandPalette Component", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should not render by default when closed", () => {
    render(<CommandPalette />);
    expect(screen.queryByTestId("command-palette")).not.toBeInTheDocument();
  });

  it("should open when Ctrl+K is pressed and close when Escape is pressed", async () => {
    render(<CommandPalette />);

    // Press Ctrl+K
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }));
    });

    expect(screen.getByTestId("command-palette")).toBeInTheDocument();

    // Press Escape
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });

    expect(screen.queryByTestId("command-palette")).not.toBeInTheDocument();
  });

  it("should debounce searches and call searchCrmAction only once after typing pauses", async () => {
    vi.mocked(searchCrmAction).mockResolvedValue(mockResults);

    render(<CommandPalette />);

    // Open palette
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }));
    });

    const input = screen.getByPlaceholderText(/Search accounts, contacts/);

    // Type a query
    fireEvent.change(input, { target: { value: "A" } });
    fireEvent.change(input, { target: { value: "Ac" } });
    fireEvent.change(input, { target: { value: "Acme" } });

    // Ensure it hasn't called searchCrmAction yet
    expect(searchCrmAction).not.toHaveBeenCalled();

    // Fast-forward time past 120ms debounce
    await act(async () => {
      vi.advanceTimersByTime(130);
    });

    expect(searchCrmAction).toHaveBeenCalledTimes(1);
    expect(searchCrmAction).toHaveBeenCalledWith("Acme");

    // Wait for the results to render by flushing microtasks
    await act(async () => {});

    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Big Deal")).toBeInTheDocument();
  });

  it("should navigate and close the palette when a result is clicked", async () => {
    vi.mocked(searchCrmAction).mockResolvedValue(mockResults);

    render(<CommandPalette />);

    // Open palette
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }));
    });

    const input = screen.getByPlaceholderText(/Search accounts, contacts/);
    fireEvent.change(input, { target: { value: "Acme" } });

    await act(async () => {
      vi.advanceTimersByTime(130);
    });

    await act(async () => {});

    expect(screen.getByText("Acme Corp")).toBeInTheDocument();

    const link = screen.getByText("Acme Corp");
    fireEvent.click(link);

    // Expect navigation and closed command palette
    expect(mockRouter.push).toHaveBeenCalledWith("/accounts/acc1");
    expect(screen.queryByTestId("command-palette")).not.toBeInTheDocument();
  });
});

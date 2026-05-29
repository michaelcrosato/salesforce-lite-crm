import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { LeadForm } from "@/components/lead-form";
import { createLeadAction } from "@/app/leads/actions";

// Mock lead action and toast hooks
vi.mock("@/app/leads/actions", () => ({
  createLeadAction: vi.fn(),
}));

const mockShowToast = vi.fn();
vi.mock("@/components/ui/toast", () => ({
  useToast: () => ({
    showToast: mockShowToast,
  }),
}));

describe("LeadForm Component", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("renders form elements properly", () => {
    render(<LeadForm />);
    expect(screen.getByLabelText("First name")).toBeInTheDocument();
    expect(screen.getByLabelText("Last name")).toBeInTheDocument();
    expect(screen.getByLabelText("Phone")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Province")).toBeInTheDocument();
    expect(screen.getByLabelText("Source")).toBeInTheDocument();
  });

  it("surfaces validation errors when createLeadAction fails", async () => {
    vi.mocked(createLeadAction).mockResolvedValue({
      ok: false,
      message: "Lead validation failed",
      fieldErrors: {
        firstName: ["First name is required"],
        email: ["Invalid email address"],
      },
    });

    render(<LeadForm />);

    // Fill in required fields
    fireEvent.change(screen.getByLabelText("First name"), { target: { value: "" } });
    fireEvent.change(screen.getByLabelText("Last name"), { target: { value: "Smith" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "invalid-email" } });

    // Submit form
    const submitBtn = screen.getByTestId("lead-form-submit") as HTMLButtonElement;
    await act(async () => {
      fireEvent.submit(submitBtn.form!);
    });

    // Assert that validation errors are surfaced in the UI
    await waitFor(() => {
      expect(screen.getByText("First name is required")).toBeInTheDocument();
      expect(screen.getByText("Invalid email address")).toBeInTheDocument();
      expect(mockShowToast).toHaveBeenCalledWith({
        title: "Lead not saved",
        description: "Lead validation failed",
        variant: "error",
      });
    });
  });

  it("handles successful form submission", async () => {
    vi.mocked(createLeadAction).mockResolvedValue({
      ok: true,
      message: "Lead successfully created",
    });

    render(<LeadForm />);

    fireEvent.change(screen.getByLabelText("First name"), { target: { value: "Alice" } });
    fireEvent.change(screen.getByLabelText("Last name"), { target: { value: "Wonderland" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "alice@example.com" } });

    const submitBtn = screen.getByTestId("lead-form-submit") as HTMLButtonElement;
    await act(async () => {
      fireEvent.submit(submitBtn.form!);
    });

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith({
        title: "Lead saved",
        description: "Lead successfully created",
        variant: "success",
      });
      // The form fields should be reset on success
      expect(screen.getByLabelText("First name")).toHaveValue("");
      expect(screen.getByLabelText("Last name")).toHaveValue("");
    });
  });
});

import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Button } from "@/components/ui/button";

describe("Button Component Styling & Variants", () => {
  it("renders a default variant button with correct styles", () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button.className).toContain("bg-primary");
    expect(button.className).toContain("text-primary-foreground");
  });

  it("renders an outline variant button with correct styles", () => {
    render(<Button variant="outline">Outline</Button>);
    const button = screen.getByRole("button", { name: /outline/i });
    expect(button).toBeInTheDocument();
    expect(button.className).toContain("border");
    expect(button.className).toContain("border-input");
    expect(button.className).toContain("bg-background");
  });

  it("renders a secondary variant button with correct styles", () => {
    render(<Button variant="secondary">Secondary</Button>);
    const button = screen.getByRole("button", { name: /secondary/i });
    expect(button).toBeInTheDocument();
    expect(button.className).toContain("bg-secondary");
    expect(button.className).toContain("text-secondary-foreground");
  });

  it("renders a destructive variant button with correct styles", () => {
    render(<Button variant="destructive">Destructive</Button>);
    const button = screen.getByRole("button", { name: /destructive/i });
    expect(button).toBeInTheDocument();
    expect(button.className).toContain("bg-destructive");
    expect(button.className).toContain("text-destructive-foreground");
  });

  it("renders a small size button correctly", () => {
    render(<Button size="sm">Small Button</Button>);
    const button = screen.getByRole("button", { name: /small button/i });
    expect(button).toBeInTheDocument();
    expect(button.className).toContain("h-8");
    expect(button.className).toContain("px-3");
  });

  it("shows a loading spinner and disables when loading=true", () => {
    render(<Button loading>Submit</Button>);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button.getAttribute("aria-busy")).toBe("true");
    const svg = button.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass("animate-spin");
  });
});

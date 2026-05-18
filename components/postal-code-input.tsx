"use client";

import { useState } from "react";
import { normalizePostalCode, type PostalCountry } from "@/lib/postal";

interface PostalCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  country: PostalCountry;
  error?: string;
  testid?: string;
  required?: boolean;
  disabled?: boolean;
}

export function PostalCodeInput({
  value,
  onChange,
  country,
  error,
  testid,
  required,
  disabled
}: PostalCodeInputProps) {
  const [localValue, setLocalValue] = useState(value);

  const handleBlur = () => {
    const normalized = normalizePostalCode(localValue, country);
    if (normalized) {
      setLocalValue(normalized);
      onChange(normalized);
    } else {
      // keep the raw value so parent can show error
      onChange(localValue);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
    onChange(e.target.value);
  };

  return (
    <div className="space-y-1.5">
      <input
        type="text"
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        data-testid={testid}
        disabled={disabled}
        required={required}
        placeholder={country === "CA" ? "A1A 1A1" : "12345"}
        className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
          error ? "border-destructive" : "border-input"
        }`}
      />
      {error ? (
        <p data-testid="postal-input-error" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

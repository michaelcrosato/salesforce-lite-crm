import type { z } from "zod/v4";

export type DeterministicAiOutputValidationResult<TOutput> =
  | {
      ok: true;
      data: TOutput;
      issues: [];
    }
  | {
      ok: false;
      data: null;
      issues: string[];
    };

export function validateDeterministicAiOutput<TOutput>(
  schema: z.ZodType<TOutput>,
  output: unknown
): DeterministicAiOutputValidationResult<TOutput> {
  const result = schema.safeParse(output);

  if (result.success) {
    return {
      ok: true,
      data: result.data,
      issues: []
    };
  }

  return {
    ok: false,
    data: null,
    issues: result.error.issues.map(formatIssue)
  };
}

function formatIssue(issue: z.ZodIssue): string {
  const path =
    issue.path.length > 0 ? issue.path.map(String).join(".") : "root";

  return `${path}: ${issue.message}`;
}

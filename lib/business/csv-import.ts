export type ParseResult = {
  headers: string[];
  rows: string[][];
  errors: string[];
};

export type PreviewResult = {
  headers: string[];
  rows: string[][];
  totalRows: number;
};

function parseCsvLine(line: string, lineNumber: number): { fields: string[]; error?: string } {
  const fields: string[] = [];
  let current = "";
  let inQuote = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];
    const next = line[i + 1];

    if (inQuote) {
      if (char === '"' && next === '"') {
        current += '"';
        i += 2;
        continue;
      }
      if (char === '"') {
        inQuote = false;
        i += 1;
        continue;
      }
      current += char;
      i += 1;
    } else {
      if (char === ",") {
        fields.push(current);
        current = "";
        i += 1;
        continue;
      }
      if (char === '"') {
        inQuote = true;
        i += 1;
        continue;
      }
      current += char;
      i += 1;
    }
  }

  fields.push(current);

  if (inQuote) {
    return { fields, error: `Unclosed quote on line ${lineNumber}` };
  }

  return { fields };
}

export function parseCsv(input: string): ParseResult {
  const errors: string[] = [];
  const lines = input.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");

  // trim trailing empty lines but keep internal
  while (lines.length > 0 && lines[lines.length - 1].trim() === "") {
    lines.pop();
  }

  if (lines.length === 0) {
    return { headers: [], rows: [], errors: [] };
  }

  const headerLine = lines[0].trimEnd();
  const headerParse = parseCsvLine(headerLine, 1);
  if (headerParse.error) errors.push(headerParse.error);
  const headers = headerParse.fields.map((h) => h.trim());

  const rows: string[][] = [];
  for (let li = 1; li < lines.length; li += 1) {
    const raw = lines[li];
    if (raw.trim() === "") continue;
    const line = raw.trimEnd();
    const parsed = parseCsvLine(line, li + 1);
    if (parsed.error) {
      errors.push(parsed.error);
      continue;
    }
    // tolerant trailing ws already handled by trimEnd + field trim? keep as-is per spec tolerant ws
    const trimmedFields = parsed.fields.map((f) => f.trim());
    rows.push(trimmedFields);
  }

  return { headers, rows, errors };
}

export function previewRows(input: string, limit = 5): PreviewResult {
  const { headers, rows, errors } = parseCsv(input);
  return {
    headers,
    rows: rows.slice(0, limit),
    totalRows: rows.length
  };
}

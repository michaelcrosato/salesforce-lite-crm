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

function parseCsvLine(
  line: string,
  lineNumber: number
): { fields: string[]; error?: string } {
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

function parseCsvRecords(input: string) {
  const errors: string[] = [];
  const lines = input.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");

  // trim trailing empty lines but keep internal
  while (lines.length > 0 && lines[lines.length - 1].trim() === "") {
    lines.pop();
  }

  const records: string[][] = [];
  let lineIndex = 0;

  while (lineIndex < lines.length) {
    const lineNumber = lineIndex + 1;
    const line = lines[lineIndex];
    let parsed = parseCsvLine(line, lineNumber);

    if (parsed.error) {
      let combined = line;
      let nextLineIndex = lineIndex + 1;
      let recovered = false;

      while (nextLineIndex < lines.length) {
        combined += `\n${lines[nextLineIndex]}`;
        parsed = parseCsvLine(combined, lineNumber);

        if (!parsed.error) {
          records.push(parsed.fields);
          lineIndex = nextLineIndex + 1;
          recovered = true;
          break;
        }

        nextLineIndex += 1;
      }

      if (recovered) {
        continue;
      }

      errors.push(parsed.error ?? `Unclosed quote on line ${lineNumber}`);
      lineIndex += 1;
      continue;
    }

    records.push(parsed.fields);
    lineIndex += 1;
  }

  return { records, errors };
}

export function parseCsv(input: string): ParseResult {
  const { records, errors } = parseCsvRecords(input);

  const nonEmptyRecords = records.filter(
    (record) => !(record.length === 1 && record[0].trim() === "")
  );

  if (nonEmptyRecords.length === 0) {
    return { headers: [], rows: [], errors: [] };
  }

  const [headerRecord, ...rowRecords] = nonEmptyRecords;
  const headers = headerRecord.map((h) => h.trim());

  const rows = rowRecords.map((record) => record.map((field) => field.trim()));

  return { headers, rows, errors };
}

export function previewRows(input: string, limit = 5): PreviewResult {
  const { headers, rows } = parseCsv(input);
  return {
    headers,
    rows: rows.slice(0, limit),
    totalRows: rows.length
  };
}

"use server";

import {
  getCsvDedupeReviewBundle,
  isCsvDedupeReviewBundleEntity,
  type CsvDedupeReviewBundle
} from "@/lib/server/csvDedupeReviewBundles";

export type CsvImportPreviewActionResult =
  | {
      ok: true;
      message: string;
      bundle: CsvDedupeReviewBundle;
    }
  | {
      ok: false;
      message: string;
      fieldErrors?: {
        csv?: string[];
        entity?: string[];
      };
    };

const CSV_IMPORT_PREVIEW_SAMPLE_LIMIT = 10;

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

export async function previewCsvImportReviewAction(
  formData: FormData
): Promise<CsvImportPreviewActionResult> {
  const entity = formString(formData, "entity");
  const csv = formString(formData, "csv");

  if (!isCsvDedupeReviewBundleEntity(entity)) {
    return {
      ok: false,
      message: "Choose a supported import entity.",
      fieldErrors: {
        entity: ["Choose a supported import entity."]
      }
    };
  }

  if (csv.trim().length === 0) {
    return {
      ok: false,
      message: "Paste or select a CSV file before previewing.",
      fieldErrors: {
        csv: ["Paste or select a CSV file before previewing."]
      }
    };
  }

  try {
    const bundle = await getCsvDedupeReviewBundle(entity, csv, {
      sampleLimit: CSV_IMPORT_PREVIEW_SAMPLE_LIMIT
    });
    const { safeRows, watchRows, blockRows } = bundle.operatorSummary;

    return {
      ok: true,
      message: `${bundle.label} preview: ${safeRows} safe, ${watchRows} watch, ${blockRows} block.`,
      bundle
    };
  } catch {
    return {
      ok: false,
      message: "The CSV preview could not be built."
    };
  }
}

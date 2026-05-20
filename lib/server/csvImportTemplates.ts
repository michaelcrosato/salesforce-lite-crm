import { toCsv, type CsvColumn } from "@/lib/business/csv-export";
import {
  CSV_IMPORT_PREVIEW_ENTITIES,
  getCsvImportPreviewDefinition,
  isCsvImportPreviewEntity,
  listCsvImportPreviewDefinitions,
  type CsvImportPreviewDefinition,
  type CsvImportPreviewEntity,
  type CsvImportPreviewField
} from "@/lib/server/csvImportPreview";

export const CSV_IMPORT_TEMPLATE_CONTENT_TYPE = "text/csv; charset=utf-8";
export const CSV_IMPORT_TEMPLATE_ENTITIES = CSV_IMPORT_PREVIEW_ENTITIES;

export type CsvImportTemplateEntity = CsvImportPreviewEntity;
export type CsvImportTemplateField = CsvImportPreviewField;

export type CsvImportTemplate = {
  entity: CsvImportTemplateEntity;
  label: string;
  route: string;
  filename: string;
  contentType: typeof CSV_IMPORT_TEMPLATE_CONTENT_TYPE;
  headers: readonly string[];
  requiredHeaders: readonly string[];
  fields: readonly CsvImportTemplateField[];
};

export type CsvImportTemplateCsv = CsvImportTemplate & {
  rowCount: 0;
  csv: string;
};

function buildTemplate(definition: CsvImportPreviewDefinition): CsvImportTemplate {
  const fields = definition.fields.map((field) => ({
    key: field.key,
    label: field.label,
    required: field.required,
    aliases: [...field.aliases]
  }));

  return {
    entity: definition.entity,
    label: definition.label,
    route: definition.route,
    filename: `${definition.entity}-import-template.csv`,
    contentType: CSV_IMPORT_TEMPLATE_CONTENT_TYPE,
    headers: fields.map((field) => field.label),
    requiredHeaders: fields
      .filter((field) => field.required)
      .map((field) => field.label),
    fields
  };
}

function renderHeaderOnlyCsv(template: CsvImportTemplate): string {
  const columns: CsvColumn<Record<string, unknown>>[] = template.fields.map((field) => ({
    key: field.key,
    label: field.label
  }));

  return toCsv<Record<string, unknown>>([], columns);
}

export function isCsvImportTemplateEntity(value: string): value is CsvImportTemplateEntity {
  return isCsvImportPreviewEntity(value);
}

export function listCsvImportTemplates(): CsvImportTemplate[] {
  return listCsvImportPreviewDefinitions().map(buildTemplate);
}

export function getCsvImportTemplate(entity: CsvImportTemplateEntity): CsvImportTemplate {
  return buildTemplate(getCsvImportPreviewDefinition(entity));
}

export function exportCsvImportTemplateCsv(entity: CsvImportTemplateEntity): CsvImportTemplateCsv {
  const template = getCsvImportTemplate(entity);

  return {
    ...template,
    rowCount: 0,
    csv: renderHeaderOnlyCsv(template)
  };
}

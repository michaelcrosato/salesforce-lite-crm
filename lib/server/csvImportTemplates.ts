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

export type CsvImportTemplateExampleField = CsvImportTemplateField & {
  value: string;
};

export type CsvImportTemplateExampleRow = {
  rowNumber: 2;
  values: Record<string, string>;
  fields: readonly CsvImportTemplateExampleField[];
};

export type CsvImportTemplate = {
  entity: CsvImportTemplateEntity;
  label: string;
  route: string;
  filename: string;
  contentType: typeof CSV_IMPORT_TEMPLATE_CONTENT_TYPE;
  headers: readonly string[];
  requiredHeaders: readonly string[];
  fields: readonly CsvImportTemplateField[];
  exampleRow: CsvImportTemplateExampleRow;
};

export type CsvImportTemplateCsv = CsvImportTemplate & {
  rowCount: 0;
  csv: string;
};

export type CsvImportTemplateExampleCsv = Omit<CsvImportTemplate, "filename"> & {
  filename: string;
  templateFilename: string;
  rowCount: 1;
  csv: string;
};

const exampleValuesByEntity: Record<CsvImportTemplateEntity, Record<string, string>> = {
  contacts: {
    firstName: "Maya",
    lastName: "Singh",
    email: "maya.singh@example.test",
    phone: "604-555-0101",
    title: "Operations Manager",
    status: "active",
    accountId: "acct-example"
  },
  leads: {
    firstName: "Riley",
    lastName: "Park",
    phone: "604-555-0188",
    email: "riley.park@example.test",
    postalCode: "V5K 0A1",
    province: "BC",
    source: "Website",
    status: "new"
  }
};

function buildExampleRow(
  entity: CsvImportTemplateEntity,
  fields: readonly CsvImportTemplateField[]
): CsvImportTemplateExampleRow {
  const exampleValues = exampleValuesByEntity[entity];
  const exampleFields = fields.map((field) => ({
    key: field.key,
    label: field.label,
    required: field.required,
    aliases: [...field.aliases],
    value: exampleValues[field.key] ?? ""
  }));
  const values = Object.fromEntries(
    exampleFields.map((field) => [field.key, field.value])
  );

  return {
    rowNumber: 2,
    values,
    fields: exampleFields
  };
}

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
    fields,
    exampleRow: buildExampleRow(definition.entity, fields)
  };
}

function columnsForTemplate(template: CsvImportTemplate): CsvColumn<Record<string, string>>[] {
  return template.fields.map((field) => ({
    key: field.key,
    label: field.label
  }));
}

function renderHeaderOnlyCsv(template: CsvImportTemplate): string {
  const columns = columnsForTemplate(template);

  return toCsv<Record<string, string>>([], columns);
}

function renderExampleCsv(template: CsvImportTemplate): string {
  const columns = columnsForTemplate(template);

  return toCsv<Record<string, string>>([template.exampleRow.values], columns);
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

export function exportCsvImportTemplateExampleCsv(
  entity: CsvImportTemplateEntity
): CsvImportTemplateExampleCsv {
  const template = getCsvImportTemplate(entity);

  return {
    ...template,
    filename: `${template.entity}-import-example.csv`,
    templateFilename: template.filename,
    rowCount: 1,
    csv: renderExampleCsv(template)
  };
}

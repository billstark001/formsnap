import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import * as v from "valibot";
import { createNaiveId, encodeIdentitySource, uniqueIdentitySources } from "../shared/identity.js";
import { normalizeText } from "../shared/text.js";
import type {
  FieldInfo,
  FormSnapshot,
  PortableFormSnapshot,
  PortableSnapshotCaptureOptions,
  PortableSnapshotField,
  SnapshotTextFormat,
  SnapshotTextInputFormat,
} from "../types.js";

const DEFAULT_CAPTURE: Required<PortableSnapshotCaptureOptions> = {
  naiveId: true,
  description: true,
  source: false,
};

function fieldKind(field: FieldInfo): string {
  return `${field.tag}:${field.type ?? ""}`;
}

function fieldDescription(field: FieldInfo, index: number): string {
  return (
    field.label?.text ||
    field.semantic?.slot ||
    field.name ||
    field.id ||
    `Field ${index + 1}`
  );
}

export function toPortableSnapshot(
  snapshot: FormSnapshot,
  capture: PortableSnapshotCaptureOptions = {}
): PortableFormSnapshot {
  const include = { ...DEFAULT_CAPTURE, ...capture };
  return {
    version: 3,
    createdAt: snapshot.createdAt,
    form: snapshot.form
      ? {
          key: snapshot.form.key,
          fieldCount: snapshot.form.fieldCount,
          url: snapshot.form.url,
          host: snapshot.form.host,
          pathname: snapshot.form.pathname,
          titleText: snapshot.form.titleText,
        }
      : undefined,
    fields: snapshot.fields.map((field, index): PortableSnapshotField => {
      const portable: PortableSnapshotField = {
        stableId: field.identity?.stableKey ?? createNaiveId(field, index),
        identitySources: field.identity?.sources ?? [
          encodeIdentitySource("naive-id", createNaiveId(field, index)),
        ],
        type: fieldKind(field),
      };
      if (field.value !== undefined) portable.value = field.value;
      if (field.selectedText !== undefined) portable.selectedText = field.selectedText;
      if (field.selectedValues !== undefined) portable.selectedValues = field.selectedValues;
      if (field.checked !== undefined) portable.checked = field.checked;
      if (field.groupSelectedValue !== undefined) portable.groupSelectedValue = field.groupSelectedValue;
      if (include.naiveId) portable.naiveId = createNaiveId(field, index);
      if (include.description) portable.description = fieldDescription(field, index);
      if (include.source) {
        portable.source = {
          selector: field.selector,
          name: field.name,
          id: field.id,
          label: field.label?.text,
          semantic: field.semantic?.slot,
        };
      }
      return portable;
    }),
  };
}

export function fromPortableSnapshot(snapshot: PortableFormSnapshot): FormSnapshot {
  return {
    version: 2,
    createdAt: snapshot.createdAt,
    form: snapshot.form
      ? {
          key: snapshot.form.key,
          fieldCount: snapshot.form.fieldCount,
          url: snapshot.form.url,
          host: snapshot.form.host,
          pathname: snapshot.form.pathname,
          titleText: snapshot.form.titleText,
          fieldTypeSequence: snapshot.fields.map((field) => field.type),
          structureHash: snapshot.form.key,
          evidence: ["portable snapshot v3"],
        }
      : undefined,
    fields: snapshot.fields.map((field, index): FieldInfo => {
      const [tag = "input", type = ""] = field.type.split(":");
      const label = field.description ?? field.source?.label;
      const semantic = field.source?.semantic ?? field.naiveId;
      return {
        selector: field.source?.selector ?? `[data-formsnap-stable-id="${field.stableId}"]`,
        tag,
        type,
        name: field.source?.name,
        id: field.source?.id,
        visible: true,
        value: field.value,
        selectedText: field.selectedText,
        selectedValues: field.selectedValues,
        checked: field.checked,
        groupSelectedValue: field.groupSelectedValue,
        label: label
          ? { text: label, source: "unknown", confidence: 0.5, evidence: ["portable snapshot"] }
          : undefined,
        semantic: semantic
          ? { slot: semantic, confidence: 0.5, evidence: ["portable snapshot"] }
          : undefined,
        identity: {
          stableKey: field.stableId,
          selectorReliability: field.source?.selector ? 70 : 0,
          sources: uniqueIdentitySources([
            ...field.identitySources,
            encodeIdentitySource("stable-key", field.stableId),
            field.naiveId ? encodeIdentitySource("naive-id", field.naiveId) : undefined,
            label ? encodeIdentitySource("label", normalizeText(label)) : undefined,
            semantic ? encodeIdentitySource("semantic", semantic) : undefined,
          ]),
          evidence: ["portable snapshot"],
        },
        aliases: [field.naiveId, field.description].filter(Boolean) as string[],
        debug: { portableIndex: index },
      };
    }),
  };
}

export function normalizeSnapshotInput(input: unknown): FormSnapshot {
  if (Array.isArray(input)) {
    // !!! LEGACY COMPATIBILITY ONLY !!!
    // Raw FieldInfo[] import/export predates the versioned snapshot format.
    // Keep this path so old saved payloads can restore, but do not extend it for new features.
    return {
      version: 2,
      createdAt: new Date().toISOString(),
      fields: input as FieldInfo[],
    };
  }
  if (isPortableSnapshot(input)) return fromPortableSnapshot(input);
  if (isFormSnapshot(input)) return input;
  throw new Error("Unsupported FormSnap import format");
}

export function isPortableSnapshot(input: unknown): input is PortableFormSnapshot {
  return v.safeParse(portableSnapshotSchema, input).success;
}

function isFormSnapshot(input: unknown): input is FormSnapshot {
  return v.safeParse(formSnapshotSchema, input).success;
}

export function stringifySnapshot(
  snapshot: PortableFormSnapshot,
  format: SnapshotTextFormat
): string {
  return format === "json" ? JSON.stringify(snapshot, null, 2) : stringifyYaml(snapshot);
}

export function parseSnapshotText(
  text: string,
  format: SnapshotTextInputFormat = "auto"
): FormSnapshot {
  const trimmed = text.trim();
  if (!trimmed) throw new Error("Import text is empty");
  if (format === "json" || (format === "auto" && /^[\[{]/.test(trimmed))) {
    return normalizeSnapshotInput(JSON.parse(trimmed));
  }
  return normalizeSnapshotInput(parseYaml(trimmed));
}

const selectedValueSchema = v.object({
  value: v.string(),
  text: v.string(),
});

const fieldSourceSchema = v.object({
  selector: v.optional(v.string()),
  name: v.optional(v.string()),
  id: v.optional(v.string()),
  label: v.optional(v.string()),
  semantic: v.optional(v.string()),
});

const portableFieldSchema = v.object({
  stableId: v.string(),
  identitySources: v.array(v.string()),
  naiveId: v.optional(v.string()),
  description: v.optional(v.string()),
  type: v.string(),
  value: v.optional(v.string()),
  selectedText: v.optional(v.string()),
  selectedValues: v.optional(v.array(selectedValueSchema)),
  checked: v.optional(v.boolean()),
  groupSelectedValue: v.optional(v.nullable(v.string())),
  source: v.optional(fieldSourceSchema),
});

const portableSnapshotSchema = v.object({
  version: v.literal(3),
  createdAt: v.string(),
  form: v.optional(v.object({
    key: v.string(),
    fieldCount: v.number(),
    url: v.optional(v.string()),
    host: v.optional(v.string()),
    pathname: v.optional(v.string()),
    titleText: v.optional(v.string()),
  })),
  fields: v.array(portableFieldSchema),
});

const formSnapshotSchema = v.object({
  version: v.literal(2),
  createdAt: v.string(),
  form: v.optional(v.unknown()),
  fields: v.array(v.unknown()),
  rulesVersion: v.optional(v.string()),
});

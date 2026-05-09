import { describe, expect, it } from "vitest";
import {
  fromPortableSnapshot,
  normalizeSnapshotInput,
  parseSnapshotText,
  stringifySnapshot,
  toPortableSnapshot,
} from "../snapshot/index.js";
import type { FieldInfo, FormSnapshot } from "../types.js";

const field: FieldInfo = {
  selector: "#email",
  tag: "input",
  type: "email",
  name: "email",
  id: "email",
  visible: true,
  value: "user@example.test",
  label: {
    text: "Email Address",
    source: "explicit-label",
    confidence: 1,
    evidence: ["for=email"],
  },
  semantic: {
    slot: "email",
    confidence: 0.9,
    evidence: ["name"],
  },
  identity: {
    stableKey: "fs_email",
    selectorReliability: 90,
    evidence: ["id"],
  },
};

const snapshot: FormSnapshot = {
  version: 2,
  createdAt: "2026-05-09T00:00:00.000Z",
  form: {
    key: "form_x",
    fieldCount: 1,
    fieldTypeSequence: ["input:email"],
    structureHash: "hash",
    evidence: [],
  },
  fields: [field],
};

describe("portable snapshot format", () => {
  it("exports source only when selected", () => {
    const portable = toPortableSnapshot(snapshot);
    expect(portable.version).toBe(3);
    expect(portable.fields[0]).toMatchObject({
      stableId: "fs_email",
      identitySources: [expect.any(String)],
      naiveId: "email",
      description: "Email Address",
      type: "input:email",
      value: "user@example.test",
    });
    expect(portable.fields[0].source).toBeUndefined();

    expect(toPortableSnapshot(snapshot, { source: true }).fields[0].source).toMatchObject({
      selector: "#email",
      name: "email",
      label: "Email Address",
      semantic: "email",
    });
  });

  it("parses JSON and YAML into restore snapshots", () => {
    const portable = toPortableSnapshot(snapshot, { source: true });
    const fromJson = parseSnapshotText(stringifySnapshot(portable, "json"));
    const fromYaml = parseSnapshotText(stringifySnapshot(portable, "yaml"));

    expect(fromJson.fields[0].identity?.stableKey).toBe("fs_email");
    expect(fromYaml.fields[0].identity?.stableKey).toBe("fs_email");
    expect(fromJson.fields[0].identity?.sources?.every((source) => typeof source === "string")).toBe(true);
    expect(fromPortableSnapshot(portable).fields[0].selector).toBe("#email");
  });

  it("keeps legacy raw arrays importable", () => {
    const normalized = normalizeSnapshotInput([field]);
    expect(normalized.version).toBe(2);
    expect(normalized.fields[0].selector).toBe("#email");
  });
});

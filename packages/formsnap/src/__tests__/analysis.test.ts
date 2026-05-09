import { describe, it, expect, beforeEach, vi } from "vitest";
import { JSDOM } from "jsdom";
import {
  analyzeFields,
  collectSnapshot,
  createRestorePlan,
  defaultHeuristicRules,
  getSelectorReliability,
  looksDynamicToken,
  matchFields,
  mergeRuleSets,
  normalizeRuleSet,
  restoreSnapshot,
  applyHeuristicRules,
  encodeIdentitySource,
} from "../index.js";
import type { FieldInfo, HeuristicRuleSet } from "../types.js";

let dom: JSDOM;
let doc: Document;

function setup(html: string): Document {
  dom = new JSDOM(`<!DOCTYPE html><html><head><title>T</title></head><body>${html}</body></html>`, {
    pretendToBeVisual: true,
    url: "https://example.com/apply",
  });
  doc = dom.window.document;
  (global as any).document = doc;
  (global as any).location = dom.window.location;
  (global as any).getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
  (global as any).HTMLInputElement = dom.window.HTMLInputElement;
  (global as any).HTMLTextAreaElement = dom.window.HTMLTextAreaElement;
  (global as any).Event = dom.window.Event;
  (global as any).CSS = { escape: (s: string) => s.replace(/([!"#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~])/g, "\\$1") };
  return doc;
}

beforeEach(() => {
  setup("");
});

describe("label detection", () => {
  it("detects explicit, wrapped, aria, placeholder, table, fieldset, nearby and token labels", () => {
    setup(`
      <label for="email">Email Address *</label><input id="email" value="a@b.test">
      <label><input name="wrappedName" value="x"> Wrapped Name</label>
      <span id="phone-label">電話番号</span><input aria-labelledby="phone-label" value="090">
      <input aria-label="会社名" value="ACME">
      <input placeholder="郵便番号" value="1234567">
      <table><thead><tr><th>氏名</th></tr></thead><tbody><tr><td><input value="山田"></td></tr></tbody></table>
      <fieldset><legend>住所</legend><input value="Tokyo"></fieldset>
      <div><span>部署</span><input value="Sales"></div>
      <input name="applicant_email_0" value="token@test">
    `);
    const fields = analyzeFields({ includeEmpty: true }, doc);
    expect(fields[0].label?.source).toBe("explicit-label");
    expect(fields[0].label?.text).toBe("Email Address");
    expect(fields[1].label?.source).toBe("wrapped-label");
    expect(fields[2].label?.source).toBe("aria-labelledby");
    expect(fields[3].label?.source).toBe("aria-label");
    expect(fields[4].label?.source).toBe("placeholder");
    expect(fields[5].label?.source).toBe("table-header");
    expect(fields[6].label?.source).toBe("fieldset-legend");
    expect(fields[7].label?.source).toBe("nearby-text");
    expect(fields[8].label?.source).toBe("name-id-token");
  });
});

describe("semantic detection", () => {
  it("detects common semantic slots from local evidence", () => {
    setup(`
      <input type="email" value="a@b.test">
      <label>メールアドレス<input value="a@b.test"></label>
      <label>郵便番号<input maxlength="7" value="1234567"></label>
      <label>電話番号<input value="090"></label>
      <label>住所<textarea>Tokyo</textarea></label>
      <label>会社名<input value="ACME"></label>
      <label>Favorite color<input value="blue"></label>
    `);
    const slots = analyzeFields({ includeEmpty: true }, doc).map((f) => f.semantic?.slot);
    expect(slots).toEqual([
      "email",
      "email",
      "postal_code",
      "phone.full",
      "address.full",
      "company",
      "unknown",
    ]);
  });

  it("marks postal and phone representations", () => {
    setup(`
      <label>郵便番号<input maxlength="7" value="1234567"></label>
      <label>ZIP<input placeholder="123-4567" value="123-4567"></label>
      <div><span>郵便番号</span><input maxlength="3" value="123"><input maxlength="4" value="4567"></div>
      <input type="tel" value="09012345678">
      <div><span>電話番号</span><input maxlength="3" value="090"><input maxlength="4" value="1234"></div>
    `);
    const fields = analyzeFields({ includeEmpty: true }, doc);
    expect(fields[0].semantic?.representation).toBe("single_7_digits");
    expect(fields[1].semantic?.representation).toBe("single_3_dash_4");
    expect(fields[2].semantic?.slot).toBe("postal_code.part1");
    expect(fields[3].semantic?.slot).toBe("postal_code.part2");
    expect(fields[4].semantic?.representation).toBe("single");
    expect(fields[5].semantic?.representation).toBe("split_2_or_3");
  });
});

describe("repeat groups", () => {
  it("detects repeated table and div rows and propagates labels", () => {
    setup(`
      <table>
        <thead><tr><th>Email</th><th>Phone</th></tr></thead>
        <tbody>
          <tr><td><input name="applicant[0][email]" value="a@b.test"></td><td><input name="applicant[0][phone]" value="1"></td></tr>
          <tr><td><input name="applicant[1][email]" value="c@d.test"></td><td><input name="applicant[1][phone]" value="2"></td></tr>
        </tbody>
      </table>
      <div class="row"><input placeholder="Company" value="A"></div>
      <div class="row"><input value="B"></div>
    `);
    const fields = analyzeFields({ includeEmpty: true }, doc);
    expect(fields[0].repeat?.itemIndex).toBe(0);
    expect(fields[2].repeat?.itemIndex).toBe(1);
    expect(fields[0].semantic?.slot).toBe("email");
    expect(fields[2].semantic?.slot).toBe("email");
    expect(fields[5].label?.source).toBe("repeated-group");
    expect(fields[5].label?.text).toBe("Company");
  });
});

describe("dynamic identity and matching", () => {
  it("detects dynamic tokens and lowers selector reliability", () => {
    setup(`<input id="550e8400-e29b-41d4-a716-446655440000" value="x"><input id="email" value="a@b.test">`);
    const fields = Array.from(doc.querySelectorAll("input"));
    expect(looksDynamicToken(fields[0].id)).toBe(true);
    expect(getSelectorReliability(fields[0])).toBeLessThan(50);
    expect(getSelectorReliability(fields[1])).toBeGreaterThan(80);
  });

  it("matches changed dynamic ids through label/name/structure and does not overtrust dynamic id only", () => {
    setup(`<label>Email<input id="session_12345" name="user_email" value="a@b.test"></label>`);
    const source = analyzeFields({ includeEmpty: true }, doc);
    setup(`<label>Email<input id="session_98765" name="user_email" value=""></label>`);
    const target = analyzeFields({ includeEmpty: true }, doc);
    const plan = createRestorePlan(source, target);
    expect(plan.matches[0].confidence).toBeGreaterThan(0.7);

    const weak = matchFields(
      [{ selector: "#session_12345", tag: "input", id: "session_12345", visible: true }],
      [{ selector: "#session_12345", tag: "input", id: "session_12345", visible: true }]
    );
    expect(weak.matches[0]?.confidence ?? 0).toBeLessThanOrEqual(0.3);
  });

  it("matches fields when enough stable identity sources overlap", () => {
    const source: FieldInfo = {
      selector: "#old",
      tag: "input",
      type: "email",
      visible: true,
      identity: {
        stableKey: "fs_old",
        selectorReliability: 20,
        evidence: [],
        sources: [
          encodeIdentitySource("semantic", "email"),
          encodeIdentitySource("label", "email"),
          encodeIdentitySource("name-token", "user"),
          encodeIdentitySource("naive-id", "email"),
        ],
      },
    };
    const target: FieldInfo = {
      selector: "#new",
      tag: "input",
      type: "email",
      visible: true,
      identity: {
        stableKey: "fs_new",
        selectorReliability: 20,
        evidence: [],
        sources: [
          encodeIdentitySource("semantic", "email"),
          encodeIdentitySource("label", "email"),
          encodeIdentitySource("name-token", "user"),
          encodeIdentitySource("naive-id", "email"),
        ],
      },
    };

    const plan = matchFields([source], [target], { identityMatchPreset: "balanced" });
    expect(plan.matches[0].confidence).toBeGreaterThanOrEqual(0.85);
    expect(plan.matches[0].strategy).toMatch(/identity sources/);
  });

  it("restores when an nth-of-type path is shifted by inserted markup", () => {
    setup(`<form><label>Email<input value="a@b.test"></label></form>`);
    const snapshot = collectSnapshot({ includeEmpty: true }, doc);
    setup(`<form><div></div><label>Email<input value=""></label></form>`);
    const results = restoreSnapshot(snapshot, { allowWeakMatches: true }, doc);
    expect(results[0].status).toBe("ok");
    expect((doc.querySelector("input") as HTMLInputElement).value).toBe("a@b.test");
  });

  it("reports unmatched snapshot fields as failures", () => {
    setup(`<form><label>Email<input value="a@b.test"></label></form>`);
    const snapshot = collectSnapshot({ includeEmpty: true }, doc);
    setup(`<form></form>`);
    const results = restoreSnapshot(snapshot, {}, doc);
    expect(results).toEqual([
      expect.objectContaining({ status: "fail", reason: "no-match" }),
    ]);
  });
});

describe("rule engine", () => {
  it("normalizes, merges and applies remote-style rule objects", () => {
    const remote = normalizeRuleSet({
      version: "remote",
      rules: [
        {
          id: "site.customer-code",
          scope: "site",
          priority: 200,
          confidence: 0.9,
          match: { label: { pattern: "Customer Code", flags: "i" } },
          action: { semanticSlot: "username", label: "Customer Code" },
        },
        {
          id: "bad-regex",
          scope: "global",
          match: { label: { pattern: "[" } },
          action: { semanticSlot: "email" },
        },
      ],
    });
    const merged = mergeRuleSets(defaultHeuristicRules, remote);
    setup(`<label>Customer Code<input value="abc"></label>`);
    const field = analyzeFields({ includeEmpty: true }, doc)[0];
    const applied = applyHeuristicRules(field, { element: doc.querySelector("input")! }, merged);
    expect(applied.semantic?.slot).toBe("username");
    expect(applied.semantic?.ruleIds).toContain("site.customer-code");
  });

  it("fetches and validates a remote rule set", async () => {
    const payload: HeuristicRuleSet = { version: "r1", rules: [] };
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => payload })));
    const mod = await import("../rules/index.js");
    await expect(mod.fetchHeuristicRuleSet("https://rules.test/formsnap.json")).resolves.toEqual(payload);
    vi.unstubAllGlobals();
  });
});

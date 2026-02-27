import { describe, it, expect, beforeEach } from "vitest";
import { JSDOM } from "jsdom";
import {
  isVisible,
  isEditable,
  isEmpty,
  isButtonType,
  extractInfo,
  collectFields,
} from "../collect.js";

let dom: JSDOM;
let doc: Document;

beforeEach(() => {
  dom = new JSDOM(`<!DOCTYPE html><body></body>`, {
    pretendToBeVisual: true,
  });
  doc = dom.window.document;
  // polyfill getComputedStyle for JSDOM
  (global as any).getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
  (global as any).CSS = { escape: (s: string) => s.replace(/([!"#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~])/g, "\\$1") };
  (global as any).document = doc;
});

describe("isEditable", () => {
  it("returns true for normal input", () => {
    const el = doc.createElement("input") as HTMLInputElement;
    expect(isEditable(el)).toBe(true);
  });

  it("returns false for disabled input", () => {
    const el = doc.createElement("input") as HTMLInputElement;
    el.disabled = true;
    expect(isEditable(el)).toBe(false);
  });

  it("returns false for readonly input", () => {
    const el = doc.createElement("input") as HTMLInputElement;
    el.readOnly = true;
    expect(isEditable(el)).toBe(false);
  });
});

describe("isButtonType", () => {
  it("detects submit", () => {
    const el = doc.createElement("input") as HTMLInputElement;
    el.type = "submit";
    expect(isButtonType(el)).toBe(true);
  });

  it("returns false for text input", () => {
    const el = doc.createElement("input") as HTMLInputElement;
    el.type = "text";
    expect(isButtonType(el)).toBe(false);
  });
});

describe("isEmpty", () => {
  it("returns true for empty text input", () => {
    const el = doc.createElement("input") as HTMLInputElement;
    el.type = "text";
    expect(isEmpty(el)).toBe(true);
  });

  it("returns false for non-empty text input", () => {
    const el = doc.createElement("input") as HTMLInputElement;
    el.type = "text";
    el.value = "hello";
    expect(isEmpty(el)).toBe(false);
  });

  it("returns true for unchecked checkbox", () => {
    const el = doc.createElement("input") as HTMLInputElement;
    el.type = "checkbox";
    expect(isEmpty(el)).toBe(true);
  });

  it("returns false for checked checkbox", () => {
    const el = doc.createElement("input") as HTMLInputElement;
    el.type = "checkbox";
    el.checked = true;
    expect(isEmpty(el)).toBe(false);
  });
});

describe("extractInfo", () => {
  it("extracts value from text input", () => {
    const el = doc.createElement("input") as HTMLInputElement;
    el.type = "text";
    el.name = "username";
    el.value = "alice";
    doc.body.appendChild(el);
    const info = extractInfo(el);
    expect(info.value).toBe("alice");
    expect(info.name).toBe("username");
    expect(info.tag).toBe("input");
  });

  it("extracts checked state from checkbox", () => {
    const el = doc.createElement("input") as HTMLInputElement;
    el.type = "checkbox";
    el.checked = true;
    el.value = "on";
    doc.body.appendChild(el);
    const info = extractInfo(el);
    expect(info.checked).toBe(true);
    expect(info.value).toBe("on");
  });
});

describe("collectFields", () => {
  it("collects visible non-empty text inputs", () => {
    const form = doc.createElement("form");
    const inp = doc.createElement("input") as HTMLInputElement;
    inp.type = "text";
    inp.value = "hello";
    form.appendChild(inp);
    doc.body.appendChild(form);
    const results = collectFields({ includeEmpty: false }, doc);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].value).toBe("hello");
  });

  it("skips button types by default", () => {
    const form = doc.createElement("form");
    const btn = doc.createElement("input") as HTMLInputElement;
    btn.type = "submit";
    form.appendChild(btn);
    doc.body.appendChild(form);
    const results = collectFields({ includeButtons: false, includeEmpty: true }, doc);
    expect(results.filter(r => r.type === "submit").length).toBe(0);
  });
});

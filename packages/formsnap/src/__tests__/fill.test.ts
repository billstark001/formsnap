import { describe, it, expect, beforeEach } from "vitest";
import { JSDOM } from "jsdom";
import { fillFields, fillElement, nativeSet } from "../fill.js";
import type { FieldInfo } from "../types.js";

let dom: JSDOM;
let doc: Document;

beforeEach(() => {
  dom = new JSDOM(`<!DOCTYPE html><body></body>`);
  doc = dom.window.document;
  (global as any).document = doc;
  (global as any).CSS = { escape: (s: string) => s.replace(/([!"#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~])/g, "\\$1") };
  (global as any).HTMLInputElement = dom.window.HTMLInputElement;
  (global as any).HTMLTextAreaElement = dom.window.HTMLTextAreaElement;
  (global as any).Event = dom.window.Event;
});

describe("nativeSet", () => {
  it("sets value on input", () => {
    const el = doc.createElement("input") as HTMLInputElement;
    nativeSet(el as any, "test-value");
    expect(el.value).toBe("test-value");
  });
});

describe("fillElement", () => {
  it("fills text input value", () => {
    const el = doc.createElement("input") as HTMLInputElement;
    el.type = "text";
    doc.body.appendChild(el);
    const info: FieldInfo = { selector: "input", tag: "input", visible: true, value: "hello" };
    const result = fillElement(el, info, false);
    expect(result).toBe(true);
    expect(el.value).toBe("hello");
  });

  it("fills checkbox checked state", () => {
    const el = doc.createElement("input") as HTMLInputElement;
    el.type = "checkbox";
    doc.body.appendChild(el);
    const info: FieldInfo = { selector: "input", tag: "input", visible: true, checked: true };
    fillElement(el, info, false);
    expect(el.checked).toBe(true);
  });

  it("fills select value", () => {
    const sel = doc.createElement("select") as HTMLSelectElement;
    const opt1 = doc.createElement("option") as HTMLOptionElement;
    opt1.value = "a";
    const opt2 = doc.createElement("option") as HTMLOptionElement;
    opt2.value = "b";
    sel.appendChild(opt1);
    sel.appendChild(opt2);
    doc.body.appendChild(sel);
    const info: FieldInfo = { selector: "select", tag: "select", visible: true, value: "b" };
    fillElement(sel, info, false);
    expect(sel.value).toBe("b");
  });
});

describe("fillFields", () => {
  it("skips button fields", () => {
    const info: FieldInfo = { selector: "input[type=submit]", tag: "input", type: "submit", visible: true };
    const results = fillFields([info], {}, doc);
    expect(results[0].status).toBe("skip");
    expect(results[0].reason).toBe("button");
  });

  it("returns fail when element not found", () => {
    const info: FieldInfo = { selector: "#nonexistent", tag: "input", visible: true, value: "x" };
    const results = fillFields([info], { fallbackMatch: false }, doc);
    expect(results[0].status).toBe("fail");
  });

  it("skips disabled field when fillDisabled is false", () => {
    const el = doc.createElement("input") as HTMLInputElement;
    el.id = "dis";
    el.disabled = true;
    doc.body.appendChild(el);
    const info: FieldInfo = { selector: "#dis", tag: "input", visible: true, value: "x" };
    const results = fillFields([info], { fillDisabled: false }, doc);
    expect(results[0].status).toBe("skip");
  });
});

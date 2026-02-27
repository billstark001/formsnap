import { describe, it, expect, beforeEach } from "vitest";
import { JSDOM } from "jsdom";
import { getSelector } from "../selector.js";

let dom: JSDOM;
let document: Document;

beforeEach(() => {
  dom = new JSDOM(`<!DOCTYPE html><body></body>`);
  document = dom.window.document;
});

describe("getSelector", () => {
  it("uses id when present", () => {
    const el = document.createElement("input");
    el.id = "my-field";
    document.body.appendChild(el);
    expect(getSelector(el)).toBe("#my-field");
  });

  it("builds path for element without id", () => {
    const form = document.createElement("form");
    const input = document.createElement("input");
    form.appendChild(input);
    document.body.appendChild(form);
    const sel = getSelector(input);
    expect(sel).toContain("input");
    expect(sel).toContain("form");
  });

  it("uses nth-of-type for siblings", () => {
    const form = document.createElement("form");
    const a = document.createElement("input");
    const b = document.createElement("input");
    form.appendChild(a);
    form.appendChild(b);
    document.body.appendChild(form);
    const selB = getSelector(b);
    expect(selB).toContain("input:nth-of-type(2)");
  });
});

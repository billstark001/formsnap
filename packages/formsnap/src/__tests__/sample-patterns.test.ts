import { describe, it, expect, beforeEach } from "vitest";
import { JSDOM } from "jsdom";
import { analyzeFields, collectSnapshot, restoreSnapshot } from "../index.js";
import type { FormSnapshot } from "../types.js";

let dom: JSDOM;
let doc: Document;

function setup(html: string): Document {
  dom = new JSDOM(`<!DOCTYPE html><body>${html}</body>`, {
    pretendToBeVisual: true,
    url: "https://forms.example.test/page",
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

function changedIdsSnapshot(): FormSnapshot {
  return collectSnapshot({ includeEmpty: true, includeDisabled: true }, doc);
}

beforeEach(() => setup(""));

describe("sample-derived form patterns", () => {
  it("handles a private recruiting profile with Japanese labels, social arrays and hidden backing fields", () => {
    setup(`
      <form>
        <div class="form-row"><label>姓<input name="lastName" placeholder="例）山田" value="佐藤"></label></div>
        <div class="form-row"><label>名<input name="firstName" placeholder="例）花子" value="花子"></label></div>
        <div class="form-row"><label>メールアドレス<input name="email" value="hana@example.test"></label></div>
        <div class="form-row"><label>電話番号<input name="phone" value="090-0000-0000"></label></div>
        <input type="hidden" name="socialNetworkServices[0].type" value="linkedin">
        <div class="social"><span>https://www.linkedin.example/in/</span><input name="socialNetworkServices[0].account" value="hana"></div>
        <label>志望理由<textarea name="motivation">I want to build useful software.</textarea></label>
      </form>
    `);
    const fields = analyzeFields({ includeEmpty: true }, doc);
    expect(fields.map((f) => f.semantic?.slot)).toContain("email");
    expect(fields.map((f) => f.semantic?.slot)).toContain("phone.full");
    expect(fields.find((f) => f.name === "motivation")?.semantic?.slot).toBe("title");
    expect(fields.some((f) => f.name?.includes("socialNetworkServices[0].type"))).toBe(false);

    const snapshot = changedIdsSnapshot();
    setup(`
      <form>
        <div class="form-row"><label>姓<input name="lastName" value=""></label></div>
        <div class="form-row"><label>名<input name="firstName" value=""></label></div>
        <div class="form-row"><label>メールアドレス<input name="email" value=""></label></div>
        <div class="form-row"><label>電話番号<input name="phone" value=""></label></div>
        <div class="social"><span>https://www.linkedin.example/in/</span><input name="socialNetworkServices[1].account" value=""></div>
        <label>志望理由<textarea name="motivation"></textarea></label>
      </form>
    `);
    const results = restoreSnapshot(snapshot, { allowWeakMatches: true }, doc);
    expect(results.filter((r) => r.status === "ok").length).toBeGreaterThanOrEqual(5);
    expect((doc.querySelector("input[name=email]") as HTMLInputElement).value).toBe("hana@example.test");
  });

  it("handles a badge minting panel with nearby labels, aria labels, switches and file input", () => {
    setup(`
      <section>
        <input type="file" accept="image/*">
        <button type="button" role="switch" aria-label="Toggle NFT mode" value="on">on</button>
        <div><label>Creator Share %</label><input id="royalty-a3f9e2c0" aria-label="Creator premium share percentage" type="number" value="7.5"></div>
        <div><label>Badge Name</label><input placeholder="Name the digital collectible" value="Builder"></div>
        <div><label>Actor</label><input value="theuser"></div>
        <div><label>Badge Description</label><textarea>Recognizes a launch contribution.</textarea></div>
      </section>
    `);
    const fields = analyzeFields({ includeEmpty: true }, doc);
    expect(fields.find((f) => f.type === "number")?.label?.text).toMatch(/Creator/);
    expect(fields.find((f) => f.type === "file")?.semantic?.slot).toBe("unknown");
    expect(fields.some((f) => f.tag === "button")).toBe(false);

    const snapshot = changedIdsSnapshot();
    setup(`
      <section>
        <input type="file" accept="image/*">
        <div><label>Creator Share %</label><input id="royalty-session-99" aria-label="Creator premium share percentage" type="number" value="0"></div>
        <div><label>Badge Name</label><input placeholder="Name the digital collectible" value=""></div>
        <div><label>Actor</label><input value=""></div>
        <div><label>Badge Description</label><textarea></textarea></div>
      </section>
    `);
    const results = restoreSnapshot(snapshot, { allowWeakMatches: true }, doc);
    expect(results.find((r) => r.selector.includes("file"))?.status).not.toBe("ok");
    expect((doc.querySelector("input[type=number]") as HTMLInputElement).value).toBe("7.5");
  });

  it("handles ASP.NET-style recruitment tables with generic ids and table headers", () => {
    setup(`
      <div id="pnlCategory_1">
        <table><tr><th>姓（半角大文字）</th><td><input id="tbx_1_1" name="tbx_1_1" value="YAMADA"></td></tr>
        <tr><th>名（半角大文字）</th><td><input id="tbx_1_2" name="tbx_1_2" value="HANAKO"></td></tr>
        <tr><th>電話番号</th><td><input id="tbx_221_1" name="tbx_221_1" value="090"></td></tr>
        <tr><th>住所</th><td><input id="tbx_221_2" name="tbx_221_2" value="Tokyo"></td></tr></table>
        <select id="ddl_3" name="ddl_3"><option value=""></option><option value="jp" selected>日本語</option></select>
      </div>
    `);
    const fields = analyzeFields({ includeEmpty: true, includeOptions: true }, doc);
    expect(fields[0].label?.source).toBe("table-header");
    expect(fields[0].semantic?.slot).toBe("name.last");
    expect(fields[2].semantic?.slot).toBe("phone.full");
    expect(fields[3].semantic?.slot).toBe("address.full");
    expect(fields[4].options?.length).toBe(2);
  });

  it("handles a DS-160-like page with long stable ASP.NET prefixes, selects, N/A checkboxes and radio groups", () => {
    setup(`
      <fieldset>
        <label for="ctl00_FormView1_tbxAPP_SURNAME">Surnames</label>
        <input name="ctl00$FormView1$tbxAPP_SURNAME" id="ctl00_FormView1_tbxAPP_SURNAME" maxlength="33" value="FERNANDEZ">
        <label for="ctl00_FormView1_tbxAPP_GIVEN_NAME">Given Names</label>
        <input name="ctl00$FormView1$tbxAPP_GIVEN_NAME" id="ctl00_FormView1_tbxAPP_GIVEN_NAME" maxlength="33" value="JUAN">
        <label for="ctl00_FormView1_cbexAPP_FULL_NAME_NATIVE_NA">Does Not Apply</label>
        <input type="checkbox" name="ctl00$FormView1$cbexAPP_FULL_NAME_NATIVE_NA" id="ctl00_FormView1_cbexAPP_FULL_NAME_NATIVE_NA" checked>
        <label for="ctl00_FormView1_ddlAPP_GENDER">Sex</label>
        <select name="ctl00$FormView1$ddlAPP_GENDER" id="ctl00_FormView1_ddlAPP_GENDER"><option value=""></option><option value="M" selected>MALE</option></select>
        <label for="ctl00_FormView1_rblOtherNames">Have you ever used other names?</label>
        <table id="ctl00_FormView1_rblOtherNames"><tr><td><input type="radio" name="ctl00$FormView1$rblOtherNames" value="Y"><label>Yes</label></td><td><input type="radio" name="ctl00$FormView1$rblOtherNames" value="N" checked><label>No</label></td></tr></table>
        <label>Date of Birth</label><select name="day"><option selected>01</option></select><select name="month"><option selected>JAN</option></select><input name="year" maxlength="4" value="1990">
      </fieldset>
    `);
    const snapshot = changedIdsSnapshot();
    const fields = snapshot.fields;
    expect(fields.find((f) => f.id?.includes("SURNAME"))?.semantic?.slot).toBe("name.last");
    expect(fields.find((f) => f.id?.includes("GIVEN_NAME"))?.semantic?.slot).toBe("name.first");
    expect(fields.find((f) => f.tag === "select")?.selectedText).toBe("MALE");
    expect(fields.find((f) => f.type === "checkbox")?.checked).toBe(true);
    expect(fields.find((f) => f.type === "radio" && f.checked)?.groupSelectedValue).toBe("N");
  });

  it("handles an Element UI personal-info form with ancestor labels and readonly date input", () => {
    setup(`
      <form class="el-form">
        <div class="el-form-item user-nick-name"><label class="el-form-item__label">昵称:</label><div class="el-input"><input autocomplete="off" placeholder="你的昵称" maxlength="16" value="coder"></div></div>
        <div class="el-form-item user-my-sign"><label class="el-form-item__label">我的签名:</label><div class="el-textarea"><textarea placeholder="设置您的签名">hello</textarea></div></div>
        <div class="el-form-item user-my-sex"><label class="el-form-item__label">性别:</label><div role="radiogroup"><label role="radio"><input type="radio" value="男"></label><label role="radio"><input type="radio" value="女" checked></label></div></div>
        <div class="el-form-item user-my-date"><label class="el-form-item__label">出生日期:</label><div class="el-date-editor"><input readonly autocomplete="off" placeholder="选择日期" value="2000-01-01"></div></div>
      </form>
    `);
    const fields = analyzeFields({ includeEmpty: true, includeDisabled: true }, doc);
    expect(fields[0].label?.text).toBe("昵称");
    expect(fields[0].semantic?.slot).toBe("username");
    expect(fields[1].semantic?.slot).toBe("title");
    expect(fields[4].semantic?.slot).toBe("date");

    const snapshot = changedIdsSnapshot();
    setup(`
      <form class="el-form">
        <div class="el-form-item user-nick-name"><label class="el-form-item__label">昵称:</label><div class="el-input"><input autocomplete="off" placeholder="你的昵称" maxlength="16" value=""></div></div>
        <div class="el-form-item user-my-sign"><label class="el-form-item__label">我的签名:</label><div class="el-textarea"><textarea placeholder="设置您的签名"></textarea></div></div>
        <div class="el-form-item user-my-date"><label class="el-form-item__label">出生日期:</label><div class="el-date-editor"><input readonly autocomplete="off" placeholder="选择日期" value=""></div></div>
      </form>
    `);
    const results = restoreSnapshot(snapshot, { allowWeakMatches: true, fillReadonly: true }, doc);
    expect(results.filter((r) => r.status === "ok").length).toBeGreaterThanOrEqual(3);
    expect((doc.querySelector("textarea") as HTMLTextAreaElement).value).toBe("hello");
  });
});

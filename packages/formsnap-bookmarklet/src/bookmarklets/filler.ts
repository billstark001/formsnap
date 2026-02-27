import { fillFields } from "formsnap";
import type { FieldInfo, FillOptions } from "formsnap";

(function () {
  const MODAL_ID = "fs-filler-modal";
  const existing = document.getElementById(MODAL_ID);
  if (existing) {
    existing.remove();
    return;
  }

  const hasData = Array.isArray((window as any).__form__) && (window as any).__form__.length > 0;

  const modal = document.createElement("div");
  modal.id = MODAL_ID;
  Object.assign(modal.style, {
    position: "fixed",
    top: "5%",
    left: "50%",
    transform: "translateX(-50%)",
    width: "580px",
    maxWidth: "95vw",
    background: "#fff",
    border: "1px solid #ccc",
    borderRadius: "10px",
    boxShadow: "0 6px 30px rgba(0,0,0,.25)",
    zIndex: "2147483647",
    padding: "20px",
    fontFamily: "system-ui,sans-serif",
    fontSize: "14px",
    color: "#333",
    maxHeight: "90vh",
    overflowY: "auto",
  });

  modal.innerHTML = `
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
  <span style="font-size:16px;font-weight:700">✏️ Form Filler</span>
  <button id="fs-f-x" style="border:none;background:none;font-size:22px;cursor:pointer;color:#aaa;padding:0;line-height:1">×</button>
</div>
<div style="margin-bottom:12px;padding:8px 12px;border-radius:5px;font-size:13px;${
    hasData
      ? "background:#d1e7dd;border-left:4px solid #198754"
      : "background:#fff3cd;border-left:4px solid #ffc107"
  }">
  ${
    hasData
      ? `✅ Detected <b>window.__form__</b> with <b>${(window as any).__form__.length}</b> fields`
      : "⚠️ No <b>window.__form__</b> found — paste JSON manually"
  }
</div>
<div style="background:#f5f7fa;border:1px solid #e0e4ea;border-radius:7px;padding:14px;margin-bottom:14px">
  <div style="font-weight:600;color:#444;margin-bottom:10px">⚙️ Options</div>
  <label style="display:flex;gap:9px;margin-bottom:8px;cursor:pointer;align-items:flex-start">
    <input type="checkbox" id="fs-f-ev" checked style="margin-top:3px">
    <span><b>Fire input events</b><br><span style="color:#888;font-size:12px">Triggers input/change after fill (React/Vue/Angular compatible)</span></span>
  </label>
  <label style="display:flex;gap:9px;margin-bottom:8px;cursor:pointer;align-items:flex-start">
    <input type="checkbox" id="fs-f-fb" checked style="margin-top:3px">
    <span><b>Fallback matching</b><br><span style="color:#888;font-size:12px">Try name → id when selector fails</span></span>
  </label>
  <label style="display:flex;gap:9px;margin-bottom:8px;cursor:pointer;align-items:flex-start">
    <input type="checkbox" id="fs-f-rd" style="margin-top:3px">
    <span><b>Fill readonly fields</b></span>
  </label>
  <label style="display:flex;gap:9px;cursor:pointer;align-items:flex-start">
    <input type="checkbox" id="fs-f-ds" style="margin-top:3px">
    <span><b>Fill disabled fields</b></span>
  </label>
</div>
<div style="margin-bottom:12px">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:7px">
    <span style="font-weight:600;color:#444">📄 JSON Data</span>
    <button id="fs-f-clr" style="font-size:12px;padding:2px 8px;border:1px solid #ccc;border-radius:4px;background:#fff;cursor:pointer;color:#666">Clear</button>
  </div>
  <textarea id="fs-f-in" style="width:100%;height:180px;font-family:monospace;font-size:12px;border:1px solid #ddd;padding:8px;box-sizing:border-box;border-radius:5px;background:#fafafa;resize:vertical" placeholder="Paste JSON from Form Collector…"></textarea>
</div>
<button id="fs-f-go" style="display:block;width:100%;padding:9px;background:#0d6efd;color:#fff;border:none;border-radius:6px;font-size:15px;font-weight:600;cursor:pointer;margin-bottom:12px">▶ Fill</button>
<div id="fs-f-res" style="display:none">
  <div id="fs-f-sum" style="margin-bottom:9px;padding:8px 12px;border-radius:5px;font-size:13px"></div>
  <div id="fs-f-det" style="max-height:200px;overflow-y:auto;font-size:12px;font-family:monospace;border:1px solid #ddd;border-radius:5px;padding:8px;background:#fafafa;line-height:1.7"></div>
  <div style="margin-top:10px;text-align:right">
    <button id="fs-f-cl" style="padding:6px 16px;background:#6c757d;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:14px">Close</button>
  </div>
</div>`;

  document.body.appendChild(modal);

  if (hasData) {
    (document.getElementById("fs-f-in") as HTMLTextAreaElement).value =
      JSON.stringify((window as any).__form__, null, 2);
  }

  const close = () => modal.remove();
  document.getElementById("fs-f-x")!.onclick = close;
  document.getElementById("fs-f-cl")!.onclick = close;
  document.getElementById("fs-f-clr")!.onclick = () => {
    (document.getElementById("fs-f-in") as HTMLTextAreaElement).value = "";
  };

  document.getElementById("fs-f-go")!.onclick = () => {
    const src = (document.getElementById("fs-f-in") as HTMLTextAreaElement).value.trim();
    const options: FillOptions = {
      fireEvents: (document.getElementById("fs-f-ev") as HTMLInputElement).checked,
      fallbackMatch: (document.getElementById("fs-f-fb") as HTMLInputElement).checked,
      fillReadonly: (document.getElementById("fs-f-rd") as HTMLInputElement).checked,
      fillDisabled: (document.getElementById("fs-f-ds") as HTMLInputElement).checked,
    };

    let fields: FieldInfo[];
    try {
      fields = JSON.parse(src);
    } catch (e) {
      showResult(false, `❌ JSON parse failed: ${(e as Error).message}`, "");
      return;
    }
    if (!Array.isArray(fields)) {
      showResult(false, "❌ Data must be a JSON array", "");
      return;
    }

    const results = fillFields(fields, options);
    const ok = results.filter((r) => r.status === "ok").length;
    const skip = results.filter((r) => r.status === "skip").length;
    const fail = results.filter((r) => r.status === "fail").length;
    const lines = results.map((r) => {
      const icon = r.status === "ok" ? "✅" : r.status === "skip" ? "⏭" : "❌";
      return `${icon} ${r.selector}${r.reason ? ` (${r.reason})` : ""}`;
    });

    showResult(
      true,
      `Fill complete — ✅ <strong>${ok}</strong> filled, ⏭ <strong>${skip}</strong> skipped, ❌ <strong>${fail}</strong> failed`,
      lines.map((l) => `<div>${l}</div>`).join("")
    );
  };

  function showResult(isOk: boolean, msg: string, detail: string) {
    document.getElementById("fs-f-res")!.style.display = "block";
    const s = document.getElementById("fs-f-sum")!;
    s.style.cssText = `margin-bottom:9px;padding:8px 12px;border-radius:5px;font-size:13px;border-left:4px solid ${isOk ? "#198754" : "#dc3545"};background:${isOk ? "#d1e7dd" : "#f8d7da"}`;
    s.innerHTML = msg;
    document.getElementById("fs-f-det")!.innerHTML = detail;
  }
})();

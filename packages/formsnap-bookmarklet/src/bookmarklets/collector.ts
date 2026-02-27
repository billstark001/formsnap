import {
  collectFields,
  isVisible,
  isEditable,
  isButtonType,
  isEmpty,
  extractInfo,
} from "formsnap";
import type { CollectOptions, FieldInfo } from "formsnap";

(function () {
  const MODAL_ID = "fs-collector-modal";
  const existing = document.getElementById(MODAL_ID);
  if (existing) {
    existing.remove();
    return;
  }

  const modal = document.createElement("div");
  modal.id = MODAL_ID;
  Object.assign(modal.style, {
    position: "fixed",
    top: "5%",
    left: "50%",
    transform: "translateX(-50%)",
    width: "560px",
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
  <span style="font-size:16px;font-weight:700">📋 Form Collector</span>
  <button id="fs-c-x" style="border:none;background:none;font-size:22px;cursor:pointer;color:#aaa;padding:0;line-height:1">×</button>
</div>
<div style="background:#f5f7fa;border:1px solid #e0e4ea;border-radius:7px;padding:14px;margin-bottom:14px">
  <div style="font-weight:600;color:#444;margin-bottom:10px">⚙️ Options</div>
  <label style="display:flex;gap:9px;margin-bottom:8px;cursor:pointer;align-items:flex-start">
    <input type="checkbox" id="fs-c-h" style="margin-top:3px">
    <span><b>Include hidden</b><br><span style="color:#888;font-size:12px">type=hidden, display:none, visibility:hidden</span></span>
  </label>
  <label style="display:flex;gap:9px;margin-bottom:8px;cursor:pointer;align-items:flex-start">
    <input type="checkbox" id="fs-c-d" style="margin-top:3px">
    <span><b>Include disabled/readonly</b></span>
  </label>
  <label style="display:flex;gap:9px;margin-bottom:8px;cursor:pointer;align-items:flex-start">
    <input type="checkbox" id="fs-c-b" style="margin-top:3px">
    <span><b>Include button inputs</b><br><span style="color:#888;font-size:12px">button / submit / reset / image</span></span>
  </label>
  <label style="display:flex;gap:9px;cursor:pointer;align-items:flex-start">
    <input type="checkbox" id="fs-c-e" style="margin-top:3px">
    <span><b>Include empty fields</b></span>
  </label>
</div>
<button id="fs-c-go" style="display:block;width:100%;padding:9px;background:#198754;color:#fff;border:none;border-radius:6px;font-size:15px;font-weight:600;cursor:pointer;margin-bottom:12px">▶ Collect</button>
<div id="fs-c-res" style="display:none">
  <div id="fs-c-sum" style="margin-bottom:9px;padding:8px 12px;background:#d1e7dd;border-left:4px solid #198754;border-radius:5px;font-size:13px"></div>
  <textarea id="fs-c-out" readonly style="width:100%;height:260px;font-family:monospace;font-size:12px;border:1px solid #ddd;padding:8px;box-sizing:border-box;border-radius:5px;background:#fafafa;resize:vertical"></textarea>
  <div style="margin-top:10px;text-align:right">
    <button id="fs-c-cp" style="padding:6px 16px;background:#0d6efd;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:14px">📋 Copy</button>
    <button id="fs-c-cl" style="padding:6px 16px;background:#6c757d;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:14px;margin-left:6px">Close</button>
  </div>
</div>`;

  document.body.appendChild(modal);

  const close = () => modal.remove();
  document.getElementById("fs-c-x")!.onclick = close;
  document.getElementById("fs-c-cl")!.onclick = close;

  document.getElementById("fs-c-go")!.onclick = () => {
    const options: CollectOptions = {
      includeHidden: (document.getElementById("fs-c-h") as HTMLInputElement).checked,
      includeDisabled: (document.getElementById("fs-c-d") as HTMLInputElement).checked,
      includeButtons: (document.getElementById("fs-c-b") as HTMLInputElement).checked,
      includeEmpty: (document.getElementById("fs-c-e") as HTMLInputElement).checked,
    };

    const allEls = Array.from(
      document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
        "input,select,textarea"
      )
    ).filter((el) => !modal.contains(el));

    const collected: FieldInfo[] = [];
    for (const el of allEls) {
      if (!options.includeButtons && el.tagName === "INPUT" && isButtonType(el as HTMLInputElement)) continue;
      if (!options.includeHidden && !isVisible(el as HTMLElement)) continue;
      if (!options.includeDisabled && !isEditable(el as HTMLInputElement)) continue;
      if (!options.includeEmpty && isEmpty(el as HTMLInputElement)) continue;
      collected.push(extractInfo(el as HTMLInputElement));
    }

    (window as any).__form__ = collected;
    document.getElementById("fs-c-res")!.style.display = "block";
    document.getElementById("fs-c-sum")!.innerHTML =
      `✅ Collected <strong>${collected.length}</strong> field(s)`;
    (document.getElementById("fs-c-out") as HTMLTextAreaElement).value =
      JSON.stringify(collected, null, 2);
  };

  document.getElementById("fs-c-cp")!.onclick = () => {
    (document.getElementById("fs-c-out") as HTMLTextAreaElement).select();
    document.execCommand("copy");
    const btn = document.getElementById("fs-c-cp")!;
    btn.textContent = "✓ Copied";
    setTimeout(() => (btn.textContent = "📋 Copy"), 2000);
  };
})();

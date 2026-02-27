import { collectFields, fillFields } from "formsnap";
import type { CollectOptions, FillOptions, FieldInfo } from "formsnap";

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "collect") {
    const options = (message.payload ?? {}) as CollectOptions;
    const fields = collectFields(options);
    sendResponse(fields);
  } else if (message.type === "fill") {
    const payload = message.payload as { fields?: unknown; options?: unknown };
    if (!payload || !Array.isArray(payload.fields)) {
      sendResponse([]);
      return true;
    }
    const fields = payload.fields as FieldInfo[];
    const options = (typeof payload.options === "object" && payload.options !== null
      ? payload.options
      : {}) as FillOptions;
    const results = fillFields(fields, options);
    sendResponse(results);
  }
  return true; // Keep channel open for async
});

import { collectFields, fillFields } from "formsnap";
import type { CollectOptions, FillOptions, FieldInfo } from "formsnap";

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "collect") {
    const options = message.payload as CollectOptions;
    const fields = collectFields(options);
    sendResponse(fields);
  } else if (message.type === "fill") {
    const { fields, options } = message.payload as {
      fields: FieldInfo[];
      options: FillOptions;
    };
    const results = fillFields(fields, options);
    sendResponse(results);
  }
  return true; // Keep channel open for async
});

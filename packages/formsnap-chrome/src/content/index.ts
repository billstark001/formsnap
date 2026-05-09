import { collectSnapshot, restoreSnapshot } from "formsnap";
import type { AnalyzeOptions, FormSnapshot, RestoreOptions } from "formsnap";

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "collect") {
    const options = (message.payload ?? {}) as AnalyzeOptions;
    sendResponse(collectSnapshot(options));
  } else if (message.type === "fill") {
    const payload = message.payload as { snapshot?: unknown; options?: unknown };
    if (!payload || payload.snapshot === undefined) {
      sendResponse([]);
      return true;
    }
    const options = (
      typeof payload.options === "object" && payload.options !== null ? payload.options : {}
    ) as RestoreOptions;
    try {
      const snapshot = payload.snapshot as FormSnapshot;
      sendResponse(restoreSnapshot(snapshot, options));
    } catch (error) {
      sendResponse({ error: (error as Error).message });
    }
  }
  return true; // Keep channel open for async
});

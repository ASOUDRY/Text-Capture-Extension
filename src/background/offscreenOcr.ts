import type { OffscreenOcrResponse, RunOffscreenOcrMessage } from "../shared/types";

const OFFSCREEN_DOCUMENT_PATH = "offscreen/offscreen.html";

/**
 * Makes sure the hidden offscreen page exists before we message it.
 * Calls: none
 */
export async function ensureOffscreenDocument(): Promise<void> {
  const offscreenUrl = chrome.runtime.getURL(OFFSCREEN_DOCUMENT_PATH);

  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
    documentUrls: [offscreenUrl],
  });

  if (existingContexts.length > 0) {
    return;
  }

  await chrome.offscreen.createDocument({
    url: OFFSCREEN_DOCUMENT_PATH,
    reasons: ["WORKERS"],
    justification:
      "Run OCR in a hidden document because the service worker cannot spawn the OCR worker.",
  });
}

/**
 * Sends an OCR job to the offscreen document and waits for extracted text back.
 * For now this accepts a placeholder image source string.
 * Calls: ensureOffscreenDocument
 */
export async function runOcrInOffscreen(
  imageSource: string,
  language = "eng",
): Promise<string> {
  await ensureOffscreenDocument();

  const response = (await chrome.runtime.sendMessage({
    type: "RUN_OFFSCREEN_OCR",
    imageUrl: imageSource,
    language,
    target: "offscreen",
  } satisfies RunOffscreenOcrMessage)) as OffscreenOcrResponse | undefined;

  if (!response) {
    throw new Error("No response from offscreen document");
  }

  if (!response.ok) {
    throw new Error(response.error);
  }

  return response.extractedText;
}
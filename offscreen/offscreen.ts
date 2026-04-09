import { prepareImageForOcr } from "../src/lib/image";
import { runOcrOnImage } from "../src/lib/ocr";
console.log("offscreen.ts loaded");
type RunOffscreenOcrMessage = {
  type: "RUN_OFFSCREEN_OCR";
  imageUrl: string;
  language?: string;
};

type OffscreenMessage = RunOffscreenOcrMessage;

type OffscreenSuccessResponse = {
  ok: true;
  extractedText: string;
};

type OffscreenErrorResponse = {
  ok: false;
  error: string;
};

type OffscreenResponse = OffscreenSuccessResponse | OffscreenErrorResponse;

// Runs the full OCR flow for one image URL.
// 1. Fetch the image as a Blob
// 2. Run OCR on that Blob
// 3. Return the extracted text
async function handleRunOffscreenOcr(
  message: RunOffscreenOcrMessage,
): Promise<OffscreenResponse> {

  const imageBlob = await prepareImageForOcr(message.imageUrl);
  console.log("imageBlob:", imageBlob)
  const extractedText = await runOcrOnImage(
    imageBlob,
    message.language ?? "eng",
  );
  console.log("extractedText:", extractedText)

  return {
    ok: true,
    extractedText,
  };
}

// Listens for messages from the service worker.
// When OCR is requested, it runs OCR and sends the result back.
chrome.runtime.onMessage.addListener(
  (
    message: OffscreenMessage,
    _sender,
    sendResponse: (response: OffscreenResponse) => void,
  ) => {
    (async () => {
      try {
        if (message.type === "RUN_OFFSCREEN_OCR") {
          const response = await handleRunOffscreenOcr(message);
          sendResponse(response);
          return;
        }

        sendResponse({
          ok: false,
          error: "Unknown offscreen message type",
        });
      } catch (error) {
        sendResponse({
          ok: false,
          error: error instanceof Error ? error.message : "Unknown OCR error",
        });
      }
    })();

    return true;
  },
);
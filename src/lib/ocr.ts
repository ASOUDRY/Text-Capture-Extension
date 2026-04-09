import { createWorker } from "tesseract.js";
console.log("ocr.ts loaded")
export function normalizeOcrText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function validateOcrInput(imageBlob: Blob): void {
  if (!(imageBlob instanceof Blob)) {
    throw new Error("OCR input must be a Blob");
  }

  if (imageBlob.size === 0) {
    throw new Error("OCR input image is empty");
  }
}

export async function runOcrOnImage(imageBlob: Blob, language = "eng"): Promise<string> {
  console.log("RunOcrOnImageCalled");

  validateOcrInput(imageBlob);

  let worker;

  try {
    console.log("about to call createWorker");
    worker = await createWorker(language, 1, {
      workerPath: chrome.runtime.getURL("tesseract/worker.min.js"),
      workerBlobURL: false,
      corePath: chrome.runtime.getURL("tesseract-core"),
      logger: (m) => console.log("tesseract logger:", m),
    });
    console.log("worker created:", worker);
  } catch (error) {
    console.error("createWorker failed:", error);
    throw error;
  }

  try {
    const result = await worker.recognize(imageBlob);
    console.log("result:", result);
    const rawText = result.data.text ?? "";
    console.log("rawText:", rawText);
    return normalizeOcrText(rawText);
  } finally {
    await worker.terminate();
  }
}
// src/lib/ocr.ts

import { createWorker } from "tesseract.js";

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

export async function runOcrOnImage(
  imageBlob: Blob,
  language = "eng",
): Promise<string> {
  validateOcrInput(imageBlob);

  const worker = await createWorker(language);

  try {
    const result = await worker.recognize(imageBlob);
    const rawText = result.data.text ?? "";
    return normalizeOcrText(rawText);
  } finally {
    await worker.terminate();
  }
}
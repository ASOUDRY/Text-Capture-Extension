import type { ExtensionResponse, TranslateTextMessage } from "../shared/types";
import { runOcrInOffscreen } from "./offscreenOcr";
import { getLatestSelection } from "./selectionWorkflow";
import { cropSelectedRegionFromVisibleTab } from "./screenshotCrop";
type TranslateResponseDto = {
  translatedText: string;
};

export async function handleRunOcr(language : string): Promise<ExtensionResponse> {
  const selection = getLatestSelection();
  let lang = "";
  if (!selection) {
    return {
      ok: false,
      error: "No image region has been selected",
    };
  }
  switch (language) {
    case "ja": lang = "jpn";
    break;
    case "zh" : lang = "chi_sim";
    break;
    case "en" : lang = "eng";
    break;
  }
  const croppedImageDataUrl = await cropSelectedRegionFromVisibleTab(selection);
  const extractedText = await runOcrInOffscreen(croppedImageDataUrl, lang);

  return {
    ok: true,
    selectedImage: true,
    extractedText,
  };
}

/**
 * Sends OCR text to your backend translation endpoint and returns the translated text.
 * Calls: none
 */
async function translateText(
  text: string,
  targetLanguage: string,
): Promise<string> {
  const response = await fetch("http://localhost:8080/api/translate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      targetLanguage,
    }),
  });

  if (!response.ok) {
    throw new Error(`Translation request failed: ${response.status}`);
  }

  const data = (await response.json()) as TranslateResponseDto;

  if (!data.translatedText) {
    throw new Error("Translation response did not include translatedText");
  }

  return data.translatedText;
}

/**
 * Validates the translation request and calls the backend.
 * Calls: translateText
 */
export async function handleTranslateText(
  message: TranslateTextMessage,
): Promise<ExtensionResponse> {
  if (!message.text.trim()) {
    return {
      ok: false,
      error: "No text provided for translation",
    };
  }

  const translatedText = await translateText(
    message.text,
    message.targetLanguage,
  );

  return {
    ok: true,
    translatedText,
  };
}
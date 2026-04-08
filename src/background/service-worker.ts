import { prepareImageForOcr } from "../lib/image";
import { runOcrOnImage } from "../lib/ocr";
import type {
  ExtensionMessage,
  ExtensionResponse,
  SelectedImageResponse,
  TranslateTextMessage,
} from "../shared/types";


async function getActiveTabId(): Promise<number> {
  const tabs = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  const tabId = tabs[0]?.id;
  if (tabId === undefined) {
    throw new Error("No active tab found");
  }
  return tabId;
}

async function enableImageSelection(tabId: number): Promise<void> {
  await chrome.tabs.sendMessage(tabId, {
    type: "ENABLE_IMAGE_SELECTION",
  });
}

async function requestSelectedImage(tabId: number): Promise<string> {
  const response = (await chrome.tabs.sendMessage(tabId, {
    type: "GET_SELECTED_IMAGE",
  })) as SelectedImageResponse | undefined;
  if (!response) {
    throw new Error("No response from content script");
  }
  if (!response.ok) {
    throw new Error(response.error);
  }
  return response.imageUrl;
}
async function translateText(text: string, targetLanguage: string): Promise<string> {
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
  const data = (await response.json()) as { translatedText?: string };
  if (!data.translatedText) {
    throw new Error("Translation response did not include translatedText");
  }
  return data.translatedText;
}

async function handleStartImageSelection(): Promise<ExtensionResponse> {
  const tabId = await getActiveTabId();
  await enableImageSelection(tabId);
  return {
    ok: true,
    selectedImage: false,
  };
}

async function handleRunOcr(): Promise<ExtensionResponse> {
const tabId = await getActiveTabId();
const imageUrl = await requestSelectedImage(tabId);
const imageBlob = await prepareImageForOcr(imageUrl);
const extractedText = await runOcrOnImage(imageBlob);

  return {
    ok: true,
    selectedImage: true,
    extractedText,
  };
}

async function handleTranslateText(message: TranslateTextMessage): Promise<ExtensionResponse> {
  if (!message.text.trim()) {
    return {
      ok: false,
      error: "No text provided for translation",
    };
  }
  const translatedText = await translateText(message.text, message.targetLanguage);
  return {
    ok: true,
    translatedText,
  };
}

chrome.runtime.onMessage.addListener(
  ( message: ExtensionMessage, _sender, sendResponse: (response: ExtensionResponse) => void,) => {
    (async () => {
      try {
        switch (message.type) {
          case "START_IMAGE_SELECTION": {
            const response = await handleStartImageSelection();
            sendResponse(response);
            return;
          }
          case "RUN_OCR": {
            const response = await handleRunOcr();
            sendResponse(response);
            return;
          }
          case "TRANSLATE_TEXT": {
            const response = await handleTranslateText(message);
            sendResponse(response);
            return;
          }
          default: {
            sendResponse({
              ok: false,
              error: "Unknown message type",
            });
          }
        }
      } catch (error) {
        sendResponse({
          ok: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    })();
    return true;
  },
);
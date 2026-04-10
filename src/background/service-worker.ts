import type { ExtensionMessage, ExtensionResponse, SelectedImageResponse, TranslateTextMessage, RunOffscreenOcrMessage, OffscreenOcrResponse } from "../shared/types";
chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

const OFFSCREEN_DOCUMENT_PATH = "offscreen/offscreen.html";
// Called by handleStartImageSelection() and handleRunOcr().
// Finds the active tab so the service worker knows which page to talk to.

async function getActiveTabId(): Promise<number> {
  const tabs = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });

  const tabId = tabs[0]?.id;

  if (tabId === undefined) {
    throw new Error("No active tab found");
  }
  console.log("Step 3 tabId", tabId)
  return tabId;
}

// Called by handleStartImageSelection().
// Sends a message to capture.ts so the page enters image selection mode.
async function enableImageSelection(tabId: number): Promise<void> {
  console.log("Step 4 go to capture.ts")
  await chrome.tabs.sendMessage(tabId, {
    type: "ENABLE_IMAGE_SELECTION",
  });
}

// Called by handleRunOcr().
// Asks capture.ts for the image URL the user clicked.
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

// Called by handleTranslateText().
// Sends OCR text to your backend translation endpoint.
async function translateText( text: string, targetLanguage: string,): Promise<string> {
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

// Called by runOcrInOffscreen().
// Makes sure the hidden offscreen page exists before we message it.
async function ensureOffscreenDocument(): Promise<void> {
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
    justification: "Run OCR in a hidden document because the service worker cannot spawn the OCR worker.",
  });
}

// Called by handleRunOcr().
// Sends the selected image URL to offscreen.ts and waits for OCR text back.
async function runOcrInOffscreen( imageUrl: string, language = "eng",): Promise<string> {
  await ensureOffscreenDocument();
  const response = (await chrome.runtime.sendMessage({
    type: "RUN_OFFSCREEN_OCR",
    imageUrl,
    language,
  } satisfies RunOffscreenOcrMessage)) as OffscreenOcrResponse | undefined;
  if (!response) {
    throw new Error("No response from offscreen document");
  }
  if (!response.ok) {
    throw new Error(response.error);
  }
  return response.extractedText;
}

// Called by the popup message START_IMAGE_SELECTION.
// Flow:
// App.handleStartSelection()
// -> chrome.runtime.sendMessage(...)
// -> this function
// -> enableImageSelection()
// -> capture.ts enters selection mode
async function handleStartImageSelection(): Promise<ExtensionResponse> {
  console.log("Step 2")
  const tabId = await getActiveTabId();
  await enableImageSelection(tabId);
  return {
    ok: true,
    selectedImage: false,
  };
}

// Called by the popup message RUN_OCR.
// Flow:
// App.handleRunOcr()
// -> this function
// -> requestSelectedImage()
// -> runOcrInOffscreen()
// -> offscreen.ts
// -> image.ts + ocr.ts
// -> text comes back here
async function handleRunOcr(): Promise<ExtensionResponse> {
  const tabId = await getActiveTabId();
  console.log("tabId:", tabId);
  const imageUrl = await requestSelectedImage(tabId);
  console.log("imageUrl:", imageUrl);
  const extractedText = await runOcrInOffscreen(imageUrl, "eng");
  console.log("extractedText:", extractedText);

  return {
    ok: true,
    selectedImage: true,
    extractedText,
  };
}

// Called by the popup message TRANSLATE_TEXT.
// Flow:
// App.handleTranslate()
// -> this function
// -> translateText()
// -> backend returns translated text
async function handleTranslateText(message: TranslateTextMessage): Promise<ExtensionResponse> {
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

// Main message entry point for the popup.
// Called by App.tsx via chrome.runtime.sendMessage(...).
chrome.runtime.onMessage.addListener(
  ( message: ExtensionMessage, _sender, sendResponse: (response: ExtensionResponse) => void, ) => {
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
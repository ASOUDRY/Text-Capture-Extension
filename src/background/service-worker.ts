import type {
  ExtensionResponse,
  PopupToBackgroundMessage,
  TranslateRequest,
  TranslateResponse
} from "../shared/types";

const TRANSLATE_API_URL = "http://localhost:8080/api/translate";

async function getActiveTabId(): Promise<number> {
  const tabs = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  const tabId = tabs[0]?.id;

  if (!tabId) {
    throw new Error("No active tab found");
  }

  return tabId;
}

async function requestPageTextFromContentScript(tabId: number): Promise<string> {
  const response = await chrome.tabs.sendMessage(tabId, {
    type: "CAPTURE_PAGE_TEXT"
  });

  if (!response) {
    throw new Error("No response from content script");
  }

  if (response.error) {
    throw new Error(response.error);
  }

  return typeof response.text === "string" ? response.text : "";
}

async function translateText(
  payload: TranslateRequest
): Promise<TranslateResponse> {
  const response = await fetch(TRANSLATE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Translation request failed: ${response.status}`);
  }

  return response.json();
}

chrome.runtime.onMessage.addListener(
  (
    message: PopupToBackgroundMessage,
    _sender,
    sendResponse: (response: ExtensionResponse) => void
  ) => {
    if (message.type !== "CAPTURE_AND_TRANSLATE") {
      return;
    }

    (async () => {
      try {
        const tabId = await getActiveTabId();
        const capturedText = await requestPageTextFromContentScript(tabId);

        if (!capturedText) {
          sendResponse({
            ok: false,
            error: "No visible text found on this page"
          });
          return;
        }

        const translation = await translateText({
          text: capturedText,
          targetLanguage: message.targetLanguage
        });

        sendResponse({
          ok: true,
          capturedText,
          translatedText: translation.translatedText
        });
      } catch (error) {
        sendResponse({
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : "Unexpected error"
        });
      }
    })();

    return true;
  }
);
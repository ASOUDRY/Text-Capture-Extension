import type { ExtensionMessage, ExtensionResponse } from "../shared/types";
import { handleSelectionMessage, handleStartImageSelection } from "./selectionWorkflow";
import { handleRunOcr, handleTranslateText } from "./workflowHandler";

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

/**
 * Routes runtime messages to the correct workflow handler.
 * Calls: handleStartImageSelection, handleSelectionMessage, handleRunOcr, handleTranslateText
 */
function handleRuntimeMessage(
  message: ExtensionMessage,
  _sender: chrome.runtime.MessageSender,
  sendResponse: (response: ExtensionResponse) => void,
): boolean {
  (async () => {
    try {
      switch (message.type) {
        case "START_IMAGE_SELECTION": {
          sendResponse(await handleStartImageSelection());
          return;
        }

        case "IMAGE_REGION_SELECTED": {
          sendResponse(await handleSelectionMessage(message));
          return;
        }

        case "RUN_OCR": {
          sendResponse(await handleRunOcr(message.sourceLanguage));
          return;
        }

        case "TRANSLATE_TEXT": {
          sendResponse(await handleTranslateText(message));
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
}

chrome.runtime.onMessage.addListener(handleRuntimeMessage);
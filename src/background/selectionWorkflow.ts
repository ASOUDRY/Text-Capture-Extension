import type {
  ExtensionResponse,
  ImageRegionSelectedMessage,
  SelectedImagePayload,
} from "../shared/types";
import { getActiveTabId, sendEnableImageSelection } from "./tabMessaging";

let latestSelection: SelectedImagePayload | null = null;

/**
 * Tells the content script in the active tab to enter image selection mode.
 * Calls: getActiveTabId, sendEnableImageSelection
 */
export async function handleStartImageSelection(): Promise<ExtensionResponse> {
  const tabId = await getActiveTabId();
  await sendEnableImageSelection(tabId);

  return {
    ok: true,
    selectedImage: false,
  };
}

/**
 * Receives the selection payload sent by capture.ts and stores it for later OCR/extraction work.
 * Calls: none
 */
export async function handleSelectionMessage(
  message: ImageRegionSelectedMessage,
): Promise<ExtensionResponse> {
  latestSelection = message.payload;

  return {
    ok: true,
    selectedImage: true,
  };
}

/**
 * Returns the most recent selected image payload.
 * Calls: none
 */
export function getLatestSelection(): SelectedImagePayload | null {
  return latestSelection;
}

/**
 * Clears the stored selection payload.
 * Calls: none
 */
export function clearLatestSelection(): void {
  latestSelection = null;
}
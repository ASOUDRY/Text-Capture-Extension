/**
 * Finds the current active tab so the service worker knows where to send messages.
 * Calls: none
 */
export async function getActiveTabId(): Promise<number> {
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

/**
 * Sends a message to the content script so the page enters image selection mode.
 * Calls: none
 */
export async function sendEnableImageSelection(tabId: number): Promise<void> {
  await chrome.tabs.sendMessage(tabId, {
    type: "ENABLE_IMAGE_SELECTION",
  });
}
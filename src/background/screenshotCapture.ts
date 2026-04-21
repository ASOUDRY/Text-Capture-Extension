/**
 * Captures a screenshot of the currently visible area of the active window.
 * Returns a PNG data URL.
 * Calls: none
 */
export async function captureVisibleTabScreenshot(): Promise<string> {
  const dataUrl = await chrome.tabs.captureVisibleTab({
    format: "png",
  });

  if (!dataUrl) {
    throw new Error("Failed to capture visible tab screenshot");
  }

  return dataUrl;
}
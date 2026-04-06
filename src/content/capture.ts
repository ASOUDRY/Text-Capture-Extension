import type {
  BackgroundToContentMessage
} from "../shared/types";

function isVisible(element: HTMLElement): boolean {
  const style = window.getComputedStyle(element);
  return (
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    style.opacity !== "0"
  );
}

function captureVisibleText(): string {
  const ignoredTags = new Set([
    "SCRIPT",
    "STYLE",
    "NOSCRIPT",
    "NAV",
    "FOOTER",
    "HEADER",
    "SVG"
  ]);

  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT
  );

  const parts: string[] = [];
  let node: Node | null = walker.nextNode();

  while (node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      const parent = node.parentElement;

      if (
        text &&
        parent &&
        !ignoredTags.has(parent.tagName) &&
        isVisible(parent)
      ) {
        parts.push(text);
      }
    }

    node = walker.nextNode();
  }

  return parts.join(" ").replace(/\s+/g, " ").trim();
}

chrome.runtime.onMessage.addListener(
  (
    message: BackgroundToContentMessage,
    _sender,
    sendResponse
  ) => {
    if (message.type === "CAPTURE_PAGE_TEXT") {
      try {
        const text = captureVisibleText();
        sendResponse({ text });
      } catch (error) {
        sendResponse({
          text: "",
          error:
            error instanceof Error
              ? error.message
              : "Failed to capture page text"
        });
      }
    }

    return true;
  }
);
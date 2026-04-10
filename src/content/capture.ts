import type { ContentMessage, ContentResponse } from "../shared/types";
let selectionModeEnabled = false;
let selectedImageUrl: string | null = null;
let hoveredImage: HTMLImageElement | null = null;


function enableSelectionMode(): void {
  console.log("Step 5 enable selection");
  selectionModeEnabled = true;
  selectedImageUrl = null;
  document.body.style.cursor = "crosshair";
}

function disableSelectionMode(): void {
  selectionModeEnabled = false;
  document.body.style.cursor = "";
  clearHighlight();
}

function highlightImage(image: HTMLImageElement): void {
  clearHighlight();
  hoveredImage = image;
  hoveredImage.style.outline = "3px solid red";
}

function clearHighlight(): void {
  if (hoveredImage) {
    hoveredImage.style.outline = "";
    hoveredImage = null;
  }
}

function handleMouseOver(event: MouseEvent): void {
  if (!selectionModeEnabled) {
    return;
  }

  const image = findImageInEvent(event);

  if (image) {
    highlightImage(image);
    return;
  }

  clearHighlight();
}

function findImageInEvent(event: MouseEvent): HTMLImageElement | null {
  const path = event.composedPath();

  for (const item of path) {
    if (item instanceof HTMLImageElement) {
      return item;
    }
  }

  return null;
}

async function handlePageClick(event: MouseEvent): Promise<void> {
  console.log("click");
  if (!selectionModeEnabled) return;
  const image = findImageInEvent(event);
    console.log("image", image);
  if (!image) return;
  event.preventDefault();
  event.stopPropagation();
  selectedImageUrl = image.currentSrc || image.src;
  disableSelectionMode();
  console.log("start await")
  await chrome.runtime.sendMessage({
    type: "IMAGE_SELECTED",
    imageUrl: selectedImageUrl,
  });
    console.log("conclude await")
}


function getSelectedImage(): ContentResponse {
  if (!selectedImageUrl) {
    return {
      ok: false,
      error: "No image has been selected",
    };
  }

  return {
    ok: true,
    imageUrl: selectedImageUrl,
  };
}

chrome.runtime.onMessage.addListener(
  (message: ContentMessage, _sender, sendResponse: (response: ContentResponse) => void,) => {
    if (message.type === "ENABLE_IMAGE_SELECTION") {
      enableSelectionMode();
      sendResponse({ ok: true });
      return;
    }

    if (message.type === "GET_SELECTED_IMAGE") {
      sendResponse(getSelectedImage());
      return;
    }

    sendResponse({
      ok: false,
      error: "Unknown message type",
    });
  },
);

document.addEventListener("mouseover", handleMouseOver, true);
document.addEventListener("click", handlePageClick, true);
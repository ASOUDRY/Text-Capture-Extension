type EnableImageSelectionMessage = {
  type: "ENABLE_IMAGE_SELECTION";
};

type GetSelectedImageMessage = {
  type: "GET_SELECTED_IMAGE";
};

type ContentMessage = EnableImageSelectionMessage | GetSelectedImageMessage;

type SuccessResponse = {
  ok: true;
  imageUrl?: string;
};

type ErrorResponse = {
  ok: false;
  error: string;
};

type ContentResponse = SuccessResponse | ErrorResponse;

let selectionModeEnabled = false;
let selectedImageUrl: string | null = null;
let hoveredImage: HTMLImageElement | null = null;

function enableSelectionMode(): void {
  selectionModeEnabled = true;
  selectedImageUrl = null;
  document.body.style.cursor = "crosshair";
}

function disableSelectionMode(): void {
  selectionModeEnabled = false;
  document.body.style.cursor = "";
  clearHighlight();
}

function isSelectableImage(element: EventTarget | null): element is HTMLImageElement {
  return element instanceof HTMLImageElement;
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

  if (isSelectableImage(event.target)) {
    highlightImage(event.target);
    return;
  }

  clearHighlight();
}

function handlePageClick(event: MouseEvent): void {
  if (!selectionModeEnabled) {
    return;
  }

  if (!isSelectableImage(event.target)) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  selectedImageUrl = event.target.currentSrc || event.target.src;
  disableSelectionMode();
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
  (
    message: ContentMessage,
    _sender,
    sendResponse: (response: ContentResponse) => void,
  ) => {
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
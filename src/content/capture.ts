import type { ContentMessage, ContentResponse } from "../shared/types";
import { findImageInEvent } from "./selectionMath";
import { enableSelectionMode, disableSelectionMode, isSelectionModeEnabled, hasActiveSession, getHoveredImage, setHoveredImage, clearHoveredImage } from "./selectionState";
import { startOverlaySession, updateOverlayPosition, handlePointerDown, handlePointerMove, handlePointerUp, handlePointerCancel } from "./imageSelectionOverlay";

/**
 * Draws a red outline around the hovered image.
 * Calls: clearHighlight, setHoveredImage
 */
function highlightImage(image: HTMLImageElement): void {
  if (getHoveredImage() === image) {
    return;
  }

  clearHighlight();
  image.style.outline = "3px solid red";
  setHoveredImage(image);
}

/**
 * Removes the red outline from the current hovered image.
 * Calls: getHoveredImage, clearHoveredImage
 */
function clearHighlight(): void {
  const hoveredImage = getHoveredImage();
  if (!hoveredImage) {
    return;
  }

  hoveredImage.style.outline = "";
  clearHoveredImage();
}

/**
 * Handles hover behavior while selection mode is active.
 * Calls: isSelectionModeEnabled, hasActiveSession, findImageInEvent, clearHighlight, highlightImage
 */
function handleMouseOver(event: MouseEvent): void {
  if (!isSelectionModeEnabled() || hasActiveSession()) {
    return;
  }

  const image = findImageInEvent(event);
  if (!image) {
    clearHighlight();
    return;
  }

  highlightImage(image);
}

/**
 * Handles the click on a real DOM image and starts the overlay drag session.
 * Calls: isSelectionModeEnabled, hasActiveSession, findImageInEvent, clearHighlight, startOverlaySession
 */
function handlePageClick(event: MouseEvent): void {
  if (!isSelectionModeEnabled() || hasActiveSession()) {
    return;
  }

  const image = findImageInEvent(event);
  if (!image) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  clearHighlight();
  startOverlaySession(image);
}

/**
 * Cancels selection when the user presses Escape.
 * Calls: disableSelectionMode
 */
function handleKeyDown(event: KeyboardEvent): void {
  if (event.key === "Escape") {
    disableSelectionMode();
  }
}

/**
 * Keeps the overlay aligned when the window resizes.
 * Calls: updateOverlayPosition
 */
function handleWindowResize(): void {
  updateOverlayPosition();
}

/**
 * Keeps the overlay aligned when the page scrolls.
 * Calls: updateOverlayPosition
 */
function handleWindowScroll(): void {
  updateOverlayPosition();
}

/**
 * Handles runtime messages from the extension.
 * Right now this only enables image selection mode.
 * Calls: enableSelectionMode
 */
function handleRuntimeMessage(
  message: ContentMessage,
  _sender: chrome.runtime.MessageSender,
  sendResponse: (response: ContentResponse) => void,
): void {
  if (message.type === "ENABLE_IMAGE_SELECTION") {
    enableSelectionMode();
    sendResponse({ ok: true });
    return;
  }

  sendResponse({
    ok: false,
    error: "Unknown message type",
  });
}

chrome.runtime.onMessage.addListener(handleRuntimeMessage);
document.addEventListener("mouseover", handleMouseOver, true);
document.addEventListener("click", handlePageClick, true);

window.addEventListener("resize", handleWindowResize);
window.addEventListener("scroll", handleWindowScroll, true);
window.addEventListener("keydown", handleKeyDown, true);

document.addEventListener("pointerdown", handlePointerDown, true);
document.addEventListener("pointermove", handlePointerMove, true);
document.addEventListener("pointerup", handlePointerUp, true);
document.addEventListener("pointercancel", handlePointerCancel, true);
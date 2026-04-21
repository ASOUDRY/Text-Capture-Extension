import { buildPayload, getImagePoint } from "./selectionMath";
import { disableSelectionMode, getSession, setSession } from "./selectionState";
/**
 * Creates the overlay and blue selection box on top of the clicked image.
 * Calls: updateOverlayPosition, setSession
 */
export function startOverlaySession(image: HTMLImageElement): void {
  if (!image.complete || image.naturalWidth === 0 || image.naturalHeight === 0) {
    console.error("Image must be loaded before selection starts.");
    return;
  }

  const overlay = document.createElement("div");
  const box = document.createElement("div");

  overlay.style.position = "fixed";
  overlay.style.zIndex = "2147483647";
  overlay.style.cursor = "crosshair";
  overlay.style.background = "transparent";

  box.style.position = "absolute";
  box.style.display = "none";
  box.style.pointerEvents = "none";
  box.style.border = "2px solid #3b82f6";
  box.style.background = "rgba(59,130,246,0.15)";

  overlay.appendChild(box);
  document.body.appendChild(overlay);

  setSession({
    image,
    overlay,
    box,
    rect: image.getBoundingClientRect(),
    dragging: false,
    startX: 0,
    startY: 0,
  });

  updateOverlayPosition();
}

/**
 * Repositions the overlay so it stays exactly on top of the selected image.
 * Calls: getSession
 */
export function updateOverlayPosition(): void {
  const session = getSession();
  if (!session) {
    return;
  }

  const rect = session.image.getBoundingClientRect();
  session.rect = rect;

  session.overlay.style.left = `${rect.left}px`;
  session.overlay.style.top = `${rect.top}px`;
  session.overlay.style.width = `${rect.width}px`;
  session.overlay.style.height = `${rect.height}px`;
}

/**
 * Updates the visible blue drag box.
 * Calls: getSession
 */
export function drawBox(x1: number, y1: number, x2: number, y2: number): void {
  const session = getSession();
  if (!session) {
    return;
  }

  const left = Math.min(x1, x2);
  const top = Math.min(y1, y2);
  const width = Math.abs(x2 - x1);
  const height = Math.abs(y2 - y1);

  session.box.style.display = "block";
  session.box.style.left = `${left}px`;
  session.box.style.top = `${top}px`;
  session.box.style.width = `${width}px`;
  session.box.style.height = `${height}px`;
}

/**
 * Finalizes the selection, turns selection mode off, and sends the result to the extension.
 * Calls: buildPayload, disableSelectionMode
 */
export async function finishSelection(endX: number, endY: number): Promise<void> {
  const payload = buildPayload(endX, endY);

  disableSelectionMode();

  if (!payload) {
    console.error("Selection too small or invalid.");
    return;
  }
  await chrome.runtime.sendMessage({
    type: "IMAGE_REGION_SELECTED",
    payload,
  });
}

/**
 * Starts the drag operation when the user presses down on the overlay.
 * Calls: getSession, updateOverlayPosition, getImagePoint, drawBox
 */
export function handlePointerDown(event: PointerEvent): void {
  const session = getSession();
  if (!session || event.button !== 0) {
    return;
  }

  if (event.target !== session.overlay) {
    return;
  }

  updateOverlayPosition();

  const point = getImagePoint(event.clientX, event.clientY);
  if (!point) {
    return;
  }

  session.dragging = true;
  session.startX = point.x;
  session.startY = point.y;

  drawBox(point.x, point.y, point.x, point.y);
  session.overlay.setPointerCapture(event.pointerId);

  event.preventDefault();
}

/**
 * Updates the drag box while the user moves the pointer.
 * Calls: getSession, getImagePoint, drawBox
 */
export function handlePointerMove(event: PointerEvent): void {
  const session = getSession();
  if (!session || !session.dragging) {
    return;
  }

  const point = getImagePoint(event.clientX, event.clientY);
  if (!point) {
    return;
  }

  drawBox(session.startX, session.startY, point.x, point.y);
  event.preventDefault();
}

/**
 * Ends the drag operation and sends the crop coordinates if the selection is valid.
 * Calls: getSession, getImagePoint, disableSelectionMode, finishSelection
 */
export function handlePointerUp(event: PointerEvent): void {
  const session = getSession();
  if (!session || !session.dragging) {
    return;
  }

  session.dragging = false;

  const point = getImagePoint(event.clientX, event.clientY);
  if (!point) {
    disableSelectionMode();
    return;
  }

  void finishSelection(point.x, point.y);
  event.preventDefault();
}

/**
 * Cancels the selection if the pointer interaction is interrupted.
 * Calls: disableSelectionMode
 */
export function handlePointerCancel(): void {
  disableSelectionMode();
}
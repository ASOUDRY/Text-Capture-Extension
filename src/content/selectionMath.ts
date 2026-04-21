import type { SelectedImagePayload } from "./selectionState";
import { getSession } from "./selectionState";

/**
 * Returns the real DOM image involved in the mouse event.
 * Calls: none
 */
export function findImageInEvent(event: MouseEvent): HTMLImageElement | null {
  for (const item of event.composedPath()) {
    if (item instanceof HTMLImageElement) {
      return item;
    }
  }
  return null;
}

/**
 * Forces a number to stay inside a minimum and maximum range.
 * Calls: none
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Converts viewport pointer coordinates into coordinates inside the image.
 * Calls: getSession, clamp
 */
export function getImagePoint(clientX: number, clientY: number): { x: number; y: number } | null {
  const session = getSession();
  if (!session) {
    return null;
  }

  return {
    x: clamp(clientX - session.rect.left, 0, session.rect.width),
    y: clamp(clientY - session.rect.top, 0, session.rect.height),
  };
}

/**
 * Builds the final selection payload with viewport and natural image coordinates.
 * Calls: getSession
 */
export function buildPayload(endX: number, endY: number): SelectedImagePayload | null {
  const session = getSession();
  if (!session) {
    return null;
  }

  const { image, rect, startX, startY } = session;

  const x = Math.min(startX, endX);
  const y = Math.min(startY, endY);
  const width = Math.abs(endX - startX);
  const height = Math.abs(endY - startY);

  if (width < 3 || height < 3) {
    return null;
  }

  const scaleX = image.naturalWidth / rect.width;
  const scaleY = image.naturalHeight / rect.height;

   return {
    src: image.currentSrc || image.src,
    naturalWidth: image.naturalWidth,
    naturalHeight: image.naturalHeight,
    displayedWidth: Math.round(rect.width),
    displayedHeight: Math.round(rect.height),
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    viewportRegion: {
      x: Math.round(rect.left + x),
      y: Math.round(rect.top + y),
      width: Math.round(width),
      height: Math.round(height),
    },
    naturalRegion: {
      x: Math.round(x * scaleX),
      y: Math.round(y * scaleY),
      width: Math.round(width * scaleX),
      height: Math.round(height * scaleY),
    },
  };
}
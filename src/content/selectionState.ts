export type Region = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type SelectedImagePayload = {
  src: string;
  naturalWidth: number;
  naturalHeight: number;
  displayedWidth: number;
  displayedHeight: number;
  viewportRegion: Region;
  naturalRegion: Region;
  viewportHeight: number;
  viewportWidth: number
};

export type Session = {
  image: HTMLImageElement;
  overlay: HTMLDivElement;
  box: HTMLDivElement;
  rect: DOMRect;
  dragging: boolean;
  startX: number;
  startY: number;
};

let selectionModeEnabled = false;
let hoveredImage: HTMLImageElement | null = null;
let session: Session | null = null;
let cursorStyleInjected = false;

const SELECTION_MODE_CLASS = "image-selection-mode";

/**
 * Turns selection mode on and forces a crosshair cursor across the whole page.
 * Calls: ensureSelectionCursorStyle
 */
export function enableSelectionMode(): void {
  selectionModeEnabled = true;
  ensureSelectionCursorStyle();
  document.documentElement.classList.add(SELECTION_MODE_CLASS);
}

/**
 * Turns selection mode off, removes the forced cursor, clears hover state,
 * and removes any active overlay session.
 * Calls: clearHoveredImage, clearSession
 */
export function disableSelectionMode(): void {
  selectionModeEnabled = false;
  document.documentElement.classList.remove(SELECTION_MODE_CLASS);
  clearHoveredImage();
  clearSession();
}

/**
 * Injects a global CSS rule once so selection mode can force the crosshair cursor.
 * Calls: none
 */
function ensureSelectionCursorStyle(): void {
  if (cursorStyleInjected) {
    return;
  }

  const style = document.createElement("style");
  style.textContent = `
    html.image-selection-mode,
    html.image-selection-mode * {
      cursor: crosshair !important;
    }
  `;

  document.head.appendChild(style);
  cursorStyleInjected = true;
}

/**
 * Returns whether selection mode is currently enabled.
 * Calls: none
 */
export function isSelectionModeEnabled(): boolean {
  return selectionModeEnabled;
}

/**
 * Stores the current hovered image reference.
 * Calls: none
 */
export function setHoveredImage(image: HTMLImageElement): void {
  hoveredImage = image;
}

/**
 * Returns the current hovered image.
 * Calls: none
 */
export function getHoveredImage(): HTMLImageElement | null {
  return hoveredImage;
}

/**
 * Clears the current hovered image reference.
 * Calls: none
 */
export function clearHoveredImage(): void {
  hoveredImage = null;
}

/**
 * Stores the active drag-selection session.
 * Calls: none
 */
export function setSession(nextSession: Session): void {
  session = nextSession;
}

/**
 * Returns the active drag-selection session.
 * Calls: none
 */
export function getSession(): Session | null {
  return session;
}

/**
 * Returns whether a drag-selection session is currently active.
 * Calls: none
 */
export function hasActiveSession(): boolean {
  return session !== null;
}

/**
 * Removes the active overlay and clears the session.
 * Calls: none
 */
export function clearSession(): void {
  if (!session) {
    return;
  }

  session.overlay.remove();
  session = null;
}
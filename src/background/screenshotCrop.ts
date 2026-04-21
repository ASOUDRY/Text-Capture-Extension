import type { Region, SelectedImagePayload } from "../shared/types";
import { captureVisibleTabScreenshot } from "./screenshotCapture";

/**
 * Converts a Blob into a data URL string.
 * Calls: arrayBufferToBase64
 */
async function blobToDataUrl(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const base64 = arrayBufferToBase64(buffer);
  return `data:${blob.type};base64,${base64}`;
}

/**
 * Converts an ArrayBuffer into a base64 string.
 * Calls: none
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";

  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary);
}

/**
 * Loads a data URL into an ImageBitmap so it can be drawn onto an OffscreenCanvas.
 * Calls: none
 */
async function loadImageBitmap(dataUrl: string): Promise<ImageBitmap> {
  const response = await fetch(dataUrl);

  if (!response.ok) {
    throw new Error("Failed to load screenshot data");
  }

  const blob = await response.blob();
  return await createImageBitmap(blob);
}

/**
 * Keeps a crop region inside the actual screenshot bounds.
 * Calls: none
 */
function clampRegion(
  region: Region,
  maxWidth: number,
  maxHeight: number,
): Region {
  const x = Math.max(0, Math.min(region.x, maxWidth));
  const y = Math.max(0, Math.min(region.y, maxHeight));
  const width = Math.max(1, Math.min(region.width, maxWidth - x));
  const height = Math.max(1, Math.min(region.height, maxHeight - y));

  return { x, y, width, height };
}

/**
 * Converts the CSS-pixel viewport selection into actual screenshot-pixel coordinates.
 * This works because the screenshot is of the visible tab, while viewportRegion
 * is also measured in visible-tab coordinates.
 * Calls: clampRegion
 */
function getScaledScreenshotRegion(
  selection: SelectedImagePayload,
  screenshotWidth: number,
  screenshotHeight: number,
): Region {
  const scaleX = screenshotWidth / selection.viewportWidth;
  const scaleY = screenshotHeight / selection.viewportHeight;

  const scaledRegion: Region = {
    x: Math.round(selection.viewportRegion.x * scaleX),
    y: Math.round(selection.viewportRegion.y * scaleY),
    width: Math.round(selection.viewportRegion.width * scaleX),
    height: Math.round(selection.viewportRegion.height * scaleY),
  };

  return clampRegion(scaledRegion, screenshotWidth, screenshotHeight);
}

/**
 * Crops a rectangular region from an ImageBitmap and returns it as a PNG data URL.
 * Calls: blobToDataUrl
 */
async function cropBitmapToDataUrl(
  bitmap: ImageBitmap,
  region: Region,
): Promise<string> {
  const canvas = new OffscreenCanvas(region.width, region.height);
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Could not create 2D canvas context");
  }

  context.drawImage(
    bitmap,
    region.x,
    region.y,
    region.width,
    region.height,
    0,
    0,
    region.width,
    region.height,
  );

  const blob = await canvas.convertToBlob({ type: "image/png" });
  return await blobToDataUrl(blob);
}

/**
 * Captures the visible tab, crops the selected viewport region, and returns
 * the cropped image as a PNG data URL.
 * Calls: captureVisibleTabScreenshot, loadImageBitmap, getScaledScreenshotRegion, cropBitmapToDataUrl
 */
export async function cropSelectedRegionFromVisibleTab(
  selection: SelectedImagePayload,
): Promise<string> {
  const screenshotDataUrl = await captureVisibleTabScreenshot();
  const bitmap = await loadImageBitmap(screenshotDataUrl);

  try {
    const region = getScaledScreenshotRegion(
      selection,
      bitmap.width,
      bitmap.height,
    );

    return await cropBitmapToDataUrl(bitmap, region);
  } finally {
    bitmap.close();
  }
}
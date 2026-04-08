export function validateImageUrl(imageUrl: string): string {
  const trimmedUrl = imageUrl.trim();

  if (!trimmedUrl) {
    throw new Error("Image URL is empty");
  }

  try {
    new URL(trimmedUrl);
    return trimmedUrl;
  } catch {
    throw new Error("Image URL is invalid");
  }
}

export function isSupportedImageType(contentType: string | null): boolean {
  if (!contentType) {
    return false;
  }

  return contentType.startsWith("image/");
}

export async function fetchImageBlob(imageUrl: string): Promise<Blob> {
  const safeUrl = validateImageUrl(imageUrl);

  const response = await fetch(safeUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }

  const contentType = response.headers.get("content-type");

  if (!isSupportedImageType(contentType)) {
    throw new Error("Fetched resource is not an image");
  }

  return await response.blob();
}

export async function prepareImageForOcr(imageUrl: string): Promise<Blob> {
  const imageBlob = await fetchImageBlob(imageUrl);

  if (imageBlob.size === 0) {
    throw new Error("Fetched image is empty");
  }

  return imageBlob;
}
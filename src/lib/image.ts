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
   console.log("fetching image url:", safeUrl);

  const response = await fetch(safeUrl);
  console.log("fetch status:", response.status, response.statusText);

  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }

  const contentType = response.headers.get("content-type");
    console.log("content-type:", contentType);

  if (!isSupportedImageType(contentType)) {
    throw new Error("Fetched resource is not an image");
  }

  const blob = await response.blob();
  console.log("blob size:", blob.size);

  return blob;
}

export async function prepareImageForOcr(imageUrl: string): Promise<Blob> {
  const imageBlob = await fetchImageBlob(imageUrl);

  if (imageBlob.size === 0) {
    throw new Error("Fetched image is empty");
  }

  return imageBlob;
}
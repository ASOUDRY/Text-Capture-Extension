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

export type StartImageSelectionMessage = {
  type: "START_IMAGE_SELECTION";
};

export type RunOcrMessage = {
  type: "RUN_OCR";
  sourceLanguage: string;
};

export type TranslateTextMessage = {
  type: "TRANSLATE_TEXT";
  text: string;
  targetLanguage: string;
};

export type EnableImageSelectionMessage = {
  type: "ENABLE_IMAGE_SELECTION";
};

export type ImageRegionSelectedMessage = {
  type: "IMAGE_REGION_SELECTED";
  payload: SelectedImagePayload;
};

export type ExtensionMessage =
  | StartImageSelectionMessage
  | RunOcrMessage
  | TranslateTextMessage
  | ImageRegionSelectedMessage;

export type ExtensionSuccessResponse = {
  ok: true;
  selectedImage?: boolean;
  extractedText?: string;
  translatedText?: string;
};

export type ExtensionErrorResponse = {
  ok: false;
  error: string;
};

export type ExtensionResponse =
  | ExtensionSuccessResponse
  | ExtensionErrorResponse;

export type ContentMessage = EnableImageSelectionMessage;

export type ContentSuccessResponse = {
  ok: true;
};

export type ContentErrorResponse = {
  ok: false;
  error: string;
};

export type ContentResponse =
  | ContentSuccessResponse
  | ContentErrorResponse;

export type RunOffscreenOcrMessage = {
  type: "RUN_OFFSCREEN_OCR";
  imageUrl: string;
  language?: string;
  target: "offscreen";
};

export type OffscreenOcrResponse =
  | {
      ok: true;
      extractedText: string;
    }
  | {
      ok: false;
      error: string;
    };
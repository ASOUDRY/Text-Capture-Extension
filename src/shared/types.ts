export type StartImageSelectionMessage = {
  type: "START_IMAGE_SELECTION";
};

export type RunOcrMessage = {
  type: "RUN_OCR";
};

export type TranslateTextMessage = {
  type: "TRANSLATE_TEXT";
  text: string;
  targetLanguage: string;
};

export type ExtensionMessage =
  | StartImageSelectionMessage
  | RunOcrMessage
  | TranslateTextMessage;

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

export type SelectedImageResponse =
  | {
      ok: true;
      imageUrl: string;
    }
  | {
      ok: false;
      error: string;
    };

export type EnableImageSelectionMessage = {
  type: "ENABLE_IMAGE_SELECTION";
};

export type GetSelectedImageMessage = {
  type: "GET_SELECTED_IMAGE";
};

export type ContentMessage =
  | EnableImageSelectionMessage
  | GetSelectedImageMessage;

export type ContentSuccessResponse = {
  ok: true;
  imageUrl?: string;
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


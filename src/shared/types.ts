export type TargetLanguage = "ch" | "jp";

export type CapturePageTextMessage = {
  type: "CAPTURE_PAGE_TEXT";
};

export type CaptureAndTranslateMessage = {
  type: "CAPTURE_AND_TRANSLATE";
  targetLanguage: TargetLanguage;
};

export type PopupToBackgroundMessage = CaptureAndTranslateMessage;

export type BackgroundToContentMessage = CapturePageTextMessage;

export type TranslateRequest = {
  text: string;
  targetLanguage: TargetLanguage;
};

export type TranslateResponse = {
  translatedText: string;
};

export type ExtensionSuccessResponse = {
  ok: true;
  capturedText: string;
  translatedText: string;
};

export type ExtensionErrorResponse = {
  ok: false;
  error: string;
};

export type ExtensionResponse = | ExtensionSuccessResponse | ExtensionErrorResponse;
import { useState } from "react";
import type { ExtensionMessage, ExtensionResponse } from "../shared/types";

function App() {
  const [selectedImage, setSelectedImage] = useState(false);
  const [extractedText, setExtractedText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("ja");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function sendMessage(message: ExtensionMessage): Promise<ExtensionResponse> {
    const response = await chrome.runtime.sendMessage(message);
    return response as ExtensionResponse;
  }

  async function handleStartSelection(): Promise<void> {
    setError("");

    try {
      const response = await sendMessage({ type: "START_IMAGE_SELECTION" });

      if (!response.ok) {
        setError(response.error);
        return;
      }

      setSelectedImage(false);
      setExtractedText("");
      setTranslatedText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start image selection");
    }
  }

  async function handleRunOcr(): Promise<void> {
    setLoading(true);
    setError("");
    setTranslatedText("");

    try {
      const response = await sendMessage({ type: "RUN_OCR" });

      if (!response.ok) {
        setError(response.error);
        return;
      }

      setSelectedImage(Boolean(response.selectedImage));
      setExtractedText(response.extractedText ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run OCR");
    } finally {
      setLoading(false);
    }
  }

  async function handleTranslate(): Promise<void> {
    if (!extractedText.trim()) {
      setError("No OCR text to translate");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await sendMessage({
        type: "TRANSLATE_TEXT",
        text: extractedText,
        targetLanguage,
      });

      if (!response.ok) {
        setError(response.error);
        return;
      }

      setTranslatedText(response.translatedText ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to translate text");
    } finally {
      setLoading(false);
    }
  }

  function handleReset(): void {
    setSelectedImage(false);
    setExtractedText("");
    setTranslatedText("");
    setError("");
    setLoading(false);
  }

  return (
    <main style={{ padding: "1rem", width: 320 }}>
      <h1>Image Text Capture</h1>

      <div style={{ marginBottom: "1rem" }}>
        <button onClick={handleStartSelection} disabled={loading}>
          Select Image
        </button>
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <button onClick={handleRunOcr} disabled={loading}>
          Run OCR
        </button>
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <label htmlFor="targetLanguage">Target language: </label>
        <select
          id="targetLanguage"
          value={targetLanguage}
          onChange={(e) => setTargetLanguage(e.target.value)}
          disabled={loading}
        >
          <option value="ja">Japanese</option>
          <option value="zh">Chinese</option>
          <option value="fr">French</option>
        </select>
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <button
          onClick={handleTranslate}
          disabled={loading || !extractedText.trim()}
        >
          Translate
        </button>
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <button onClick={handleReset} disabled={loading}>
          Reset
        </button>
      </div>

      <section style={{ marginBottom: "1rem" }}>
        <strong>Image selected:</strong> {selectedImage ? "Yes" : "No"}
      </section>

      <section style={{ marginBottom: "1rem" }}>
        <h2>Extracted Text</h2>
        <textarea
          value={extractedText}
          onChange={(e) => setExtractedText(e.target.value)}
          rows={6}
          style={{ width: "100%" }}
        />
      </section>

      <section style={{ marginBottom: "1rem" }}>
        <h2>Translated Text</h2>
        <textarea
          value={translatedText}
          readOnly
          rows={6}
          style={{ width: "100%" }}
        />
      </section>
      {loading && <p>Working...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </main>
  );
}

export default App;
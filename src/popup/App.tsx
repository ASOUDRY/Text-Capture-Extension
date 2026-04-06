import { useState } from "react";
import type {
  ExtensionResponse,
  TargetLanguage
} from "../shared/types";

const languages: { value: TargetLanguage; label: string }[] = [
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "it", label: "Italian" },
  { value: "pt", label: "Portuguese" }
];

export default function App() {
  const [targetLanguage, setTargetLanguage] = useState<TargetLanguage>("es");
  const [capturedText, setCapturedText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCaptureAndTranslate() {
    setLoading(true);
    setError("");
    setCapturedText("");
    setTranslatedText("");

    try {
      const response = (await chrome.runtime.sendMessage({
        type: "CAPTURE_AND_TRANSLATE",
        targetLanguage
      })) as ExtensionResponse;

      if (!response.ok) {
        setError(response.error);
        return;
      }

      setCapturedText(response.capturedText);
      setTranslatedText(response.translatedText);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!translatedText) return;
    await navigator.clipboard.writeText(translatedText);
  }

  return (
    <div style={{ width: 380, padding: 16, fontFamily: "Arial, sans-serif" }}>
      <h2 style={{ marginTop: 0 }}>Text Capture Translator</h2>

      <label style={{ display: "block", marginBottom: 8 }}>
        Target language
      </label>

      <select
        value={targetLanguage}
        onChange={(e) => setTargetLanguage(e.target.value as TargetLanguage)}
        style={{ width: "100%", marginBottom: 12, padding: 8 }}
      >
        {languages.map((lang) => (
          <option key={lang.value} value={lang.value}>
            {lang.label}
          </option>
        ))}
      </select>

      <button
        onClick={handleCaptureAndTranslate}
        disabled={loading}
        style={{ width: "100%", padding: 10, marginBottom: 12 }}
      >
        {loading ? "Working..." : "Capture Page Text"}
      </button>

      {error ? (
        <div style={{ color: "crimson", marginBottom: 12 }}>{error}</div>
      ) : null}

      <label style={{ display: "block", marginBottom: 8 }}>
        Captured text
      </label>
      <textarea
        value={capturedText}
        readOnly
        rows={6}
        style={{ width: "100%", marginBottom: 12, resize: "vertical" }}
      />

      <label style={{ display: "block", marginBottom: 8 }}>
        Translated text
      </label>
      <textarea
        value={translatedText}
        readOnly
        rows={6}
        style={{ width: "100%", marginBottom: 12, resize: "vertical" }}
      />

      <button
        onClick={handleCopy}
        disabled={!translatedText}
        style={{ width: "100%", padding: 10 }}
      >
        Copy Translation
      </button>
    </div>
  );
}
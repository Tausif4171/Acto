"use client";

import { useState } from "react";

export default function UploadTranscript() {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState("");
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected && selected.type === "text/plain") {
      setFile(selected);
      setFileName(selected.name);
    } else {
      alert("Please upload a valid .txt file");
    }
  };

  const handleSubmit = async () => {
    if (!file) return alert("No file selected");

    setLoading(true);
    setError("");
    setSummary("");

    try {
      const content = await file.text();

      const res = await fetch("http://localhost:8080/api/parse-transcript", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      });

      const data = await res.json();

      if (res.ok) {
        setSummary(data.summary);
      } else {
        setError(data.error || "Something went wrong");
      }
    } catch (err) {
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 bg-white p-6 rounded-xl shadow">
      <h2 className="text-xl font-bold mb-4 text-center">
        Upload Meeting Transcript
      </h2>

      <input
        type="file"
        accept=".txt"
        onChange={handleFileChange}
        className="mb-3"
      />

      {fileName && <p className="text-sm text-gray-600">📄 {fileName}</p>}

      <button
        onClick={handleSubmit}
        disabled={!file || loading}
        className="mt-3 w-full bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition"
      >
        {loading ? "Summarizing..." : "Submit"}
      </button>

      {summary && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">📝 Summary:</h3>
          <pre className="bg-gray-100 p-4 rounded whitespace-pre-wrap">
            {summary}
          </pre>
        </div>
      )}

      {error && (
        <div className="mt-4 text-red-600 text-sm font-medium">{error}</div>
      )}
    </div>
  );
}

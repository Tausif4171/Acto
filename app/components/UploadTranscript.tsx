"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
// @ts-ignore
import html2pdf from "html2pdf.js";
import { marked } from "marked";

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      const data = await res.json();
      if (res.ok) {
        setSummary(data.summary);
      } else {
        setError(data.error || "Something went wrong");
      }
    } catch {
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    const rawHTML = await marked.parse(summary);
    const styledHTML = rawHTML.replaceAll("<p>", '<p style="margin: 8px 0;">');

    const element = document.createElement("div");
    element.innerHTML = `
    <div style="
      font-family: Arial, sans-serif;
      font-size: 14px;
      padding: 80px 60px;
      line-height: 1.6;
      color: #111;
    ">
      <h1 style="font-size: 20px; font-weight: bold; margin-bottom: 16px;">
        AI Summary
      </h1>
      ${styledHTML}
    </div>
  `;

    html2pdf()
      .from(element)
      .set({
        margin: 0,
        filename: fileName.replace(".txt", "-summary.pdf"),
        html2canvas: { scale: 2 },
        jsPDF: { unit: "pt", format: "a4", orientation: "portrait" },
      })
      .save();
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-lg transition-all duration-300">
      <h2 className="text-2xl font-semibold mb-4 text-center">
        🧾 Upload Transcript
      </h2>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <input
          type="file"
          accept=".txt"
          onChange={handleFileChange}
          className="block w-full border border-gray-300 rounded-md px-4 py-2 text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-gray-100 hover:file:bg-gray-200"
        />
        <button
          onClick={handleSubmit}
          disabled={!file || loading}
          className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? "Summarizing..." : "Summarize"}
        </button>
      </div>

      {fileName && <p className="text-sm text-gray-600 mt-2">📄 {fileName}</p>}

      {summary && (
        <div className="mt-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-bold mb-2">📝 AI Summary:</h3>
          <div>
            <ReactMarkdown>{summary}</ReactMarkdown>
          </div>
          <button
            onClick={handleDownloadPDF}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            📄 Download PDF
          </button>
        </div>
      )}

      {error && (
        <div className="mt-4 text-red-600 text-sm font-medium">{error}</div>
      )}
    </div>
  );
}

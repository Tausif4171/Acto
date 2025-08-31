"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { marked } from "marked";

export default function UploadTranscript() {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState("");
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [emailStatus, setEmailStatus] = useState("");

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
    const html2pdf = (await import("html2pdf.js")).default;

    const rawHTML = await marked.parse(summary);
    const styledHTML = rawHTML.replaceAll("<p>", '<p style="margin: 8px 0;">');

    const element = document.createElement("div");
    element.innerHTML = `
    <div style="
      font-family: Arial, sans-serif;
      font-size: 14px;
      padding: 24px 32px;
      line-height: 1.6;
    ">
      <div style="margin-bottom: 14px;">
        <span style="font-size: 40px; font-weight: bold; color: tan; font-family: cursive;">Acto</span>
      </div>

      <h1 style="font-size: 20px; font-weight: bold; margin-bottom: 16px;">AI Summary</h1>
      <div style="line-height: 1.6;">
        ${styledHTML}
      </div>

      <p style="
        margin-top: 40px;
        font-size: 12px;
        color: #aaa;
        text-align: center;
        border-top: 1px solid #333;
        padding-top: 12px;
      ">
        📄 Generated with <strong>Acto.ai</strong> – AI-powered meeting insights
      </p>
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

  const handleSendEmail = async () => {
    if (!email) return alert("Please enter an email address");
    setSending(true);
    setEmailStatus("");

    try {
      const res = await fetch("http://localhost:8080/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toEmail: email,
          subject: "📄 Your Acto Summary",
          body: summary,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setEmailStatus("✅ Email sent successfully!");
      } else {
        setEmailStatus("❌ Failed to send: " + data.error);
      }
    } catch {
      setEmailStatus("❌ Failed to connect to server");
    } finally {
      setSending(false);
    }
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

      {/* Summary Section */}
      {summary && (
        <div className="mt-8 bg-gray-50 p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-xl font-bold mb-3">📝 AI Summary</h3>
          <div className="prose prose-sm max-w-none text-gray-800">
            <ReactMarkdown>{summary}</ReactMarkdown>
          </div>

          <div className="flex flex-col mt-6">
            <button
              onClick={handleDownloadPDF}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 w-56"
            >
              📄 Download PDF
            </button>

            <div className="flex gap-2 mt-4">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500"
              />
              <button
                onClick={handleSendEmail}
                disabled={!email || sending}
                className="bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700 disabled:opacity-50"
              >
                {sending ? "📤 Sending..." : "📧 Send"}
              </button>
            </div>
          </div>

          {emailStatus && (
            <p className="mt-3 text-sm text-center text-gray-700">
              {emailStatus}
            </p>
          )}
        </div>
      )}

      {error && (
        <div className="mt-4 text-red-600 text-sm font-medium">{error}</div>
      )}
    </div>
  );
}

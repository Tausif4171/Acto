"use client";

import { useState } from "react";

export default function UploadTranscript() {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");

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
    if (!file) return alert("No file selected!");

    const text = await file.text();

    // Replace with your backend API endpoint
    const res = await fetch("http://localhost:8080/api/parse-transcript", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content: text }),
    });

    const data = await res.json();
    console.log("Summary received:", data);
    // You can now display it or route to a new page with the data
  };

  return (
    <div className="max-w-xl mx-auto bg-white p-6 rounded-xl shadow mt-10">
      <h3 className="text-xl font-semibold mb-4 text-center">Try it out</h3>

      <input
        type="file"
        accept=".txt"
        onChange={handleFileChange}
        className="mb-4"
      />

      {fileName && (
        <p className="text-sm text-gray-600 mb-2">Selected: {fileName}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!file}
        className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800 transition"
      >
        Submit
      </button>
    </div>
  );
}

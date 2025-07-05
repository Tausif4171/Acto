import UploadTranscript from "./components/UploadTranscript";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 text-gray-800">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center py-20 px-4">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">Acto</h1>
        <p className="text-lg md:text-xl max-w-2xl mb-6">
          Upload your meeting transcript. Get instant summaries, action items,
          and key decisions — powered by AI.
        </p>
        <button className="bg-black text-white px-6 py-3 rounded-xl text-lg hover:bg-gray-800 transition">
          <UploadTranscript />
        </button>
      </section>

      {/* How it Works */}
      <section className="py-16 px-6 bg-white">
        <h2 className="text-3xl font-semibold text-center mb-10">
          How It Works
        </h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            ["Upload", "Drop your transcript or paste your notes."],
            ["AI Summary", "We process it with GPT to generate insights."],
            ["Download or Sync", "Export to PDF or push to Notion/email."],
          ].map(([title, desc]) => (
            <div key={title} className="p-6 bg-gray-100 rounded-xl shadow">
              <h3 className="text-xl font-bold mb-2">{title}</h3>
              <p className="text-gray-600">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6">
        <h2 className="text-3xl font-semibold text-center mb-10">Features</h2>
        <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto text-lg text-gray-700">
          <li>✅ Speaker-wise notes</li>
          <li>✅ Action item extraction</li>
          <li>✅ Export to PDF</li>
          <li>✅ Notion integration</li>
          <li>✅ Email delivery (optional)</li>
          <li>✅ 100% private & secure</li>
        </ul>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-sm text-gray-500 border-t mt-10">
        Built by Tausif 🚀 • © {new Date().getFullYear()}
      </footer>
    </main>
  );
}

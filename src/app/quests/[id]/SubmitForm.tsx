"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function QuestSubmitForm({ questId, type }: { questId: string; type: string }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let res: Response;

      if (type === "image") {
        if (!file) {
          setError("Please select an image file");
          setLoading(false);
          return;
        }
        const formData = new FormData();
        formData.append("questId", questId);
        formData.append("file", file);
        res = await fetch("/api/submissions", { method: "POST", body: formData });
      } else {
        if (!text.trim()) {
          setError("Please enter your submission");
          setLoading(false);
          return;
        }
        res = await fetch("/api/submissions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questId, textPayload: text }),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Submission failed");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      <h3 className="font-semibold">Submit Your Answer</h3>

      {type === "text" ? (
        <div>
          <label className="block text-sm font-medium mb-1">Your submission</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-star"
            placeholder="Type your answer here..."
            required
          />
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium mb-1">Upload an image</label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full text-sm border border-gray-300 rounded-lg p-2 file:mr-3 file:px-3 file:py-1 file:rounded file:border-0 file:text-sm file:bg-star-light file:text-star-dark"
          />
          <p className="text-xs text-gray-500 mt-1">JPEG, PNG, or WebP. Max 5 MB.</p>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="bg-star-dark hover:bg-star text-white font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50"
      >
        {loading ? "Submitting..." : "Submit"}
      </button>
    </form>
  );
}

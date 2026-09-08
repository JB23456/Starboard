"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Submission {
  id: string;
  questId: string;
  userId: string;
  textPayload: string | null;
  imagePath: string | null;
  status: string;
  adminNote: string | null;
  submittedAt: string;
  quest: { id: string; title: string; description: string; rewardStars: number; submissionType: string };
  user: { id: string; firstName: string; discord: string; studentNumber: string };
}

export default function AdminSubmissionsPage() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filter, setFilter] = useState("pending");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Submission | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const fetchSubmissions = useCallback(async (status?: string) => {
    const url = status ? `/api/submissions?status=${status}` : "/api/submissions";
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      setSubmissions(Array.isArray(data) ? data : []);
    }
  }, []);

  useEffect(() => { fetchSubmissions(filter); }, [filter, fetchSubmissions]);

  async function selectSubmission(id: string) {
    const res = await fetch(`/api/submissions/${id}`);
    if (res.ok) {
      const data = await res.json();
      setSelected(data);
      setSelectedId(id);
      setNote("");
      setError("");
    }
  }

  async function handleReview(status: "approved" | "rejected") {
    if (!selectedId) return;
    if (status === "rejected" && !note.trim()) {
      setError("A note is required when rejecting.");
      return;
    }

    const res = await fetch(`/api/submissions/${selectedId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, adminNote: note || null }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Review failed");
      return;
    }
    setSelected(null);
    setSelectedId(null);
    fetchSubmissions(filter);
    router.refresh();
  }

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Submissions</h1>

      <div className="flex gap-2 mb-4">
        {["pending", "approved", "rejected", ""].map((s) => (
          <button
            key={s || "all"}
            onClick={() => { setFilter(s); setSelected(null); }}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              filter === s ? "bg-star-dark text-white" : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            {s === "" ? "All" : s[0].toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Queue list */}
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {submissions.length === 0 ? (
            <p className="text-gray-500 text-sm">No {filter || ""} submissions.</p>
          ) : (
            submissions.map((s) => (
              <button
                key={s.id}
                onClick={() => selectSubmission(s.id)}
                className={`w-full text-left p-3 rounded-lg border text-sm ${
                  selectedId === s.id ? "border-star-dark bg-star-light" : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="flex justify-between">
                  <span className="font-medium">{s.quest.title}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${statusColors[s.status]}`}>
                    {s.status}
                  </span>
                </div>
                <p className="text-gray-500 mt-1">
                  {s.user.firstName} ({s.user.discord}) &middot; {new Date(s.submittedAt).toLocaleDateString()}
                </p>
              </button>
            ))
          )}
        </div>

        {/* Review panel */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          {!selected ? (
            <p className="text-gray-500 text-sm">Select a submission to review.</p>
          ) : (
            <div className="space-y-4">
              <h3 className="font-semibold">{selected.quest.title}</h3>
              <p className="text-sm text-gray-600">{selected.quest.description}</p>

              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm font-medium mb-1">
                  Submitted by: {selected.user.firstName} ({selected.user.discord})
                </p>
                {selected.textPayload && (
                  <p className="text-sm whitespace-pre-wrap">{selected.textPayload}</p>
                )}
                {selected.imagePath && (
                  <img
                    src={`/api/images/${selected.imagePath}`}
                    alt="Submission"
                    className="max-h-64 rounded mt-2"
                  />
                )}
              </div>

              {selected.adminNote && (
                <p className="text-sm text-gray-500">Previous note: {selected.adminNote}</p>
              )}

              {selected.status === "pending" && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Note (required for rejection)</label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={2}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      placeholder="Optional for approval, required for rejection"
                    />
                  </div>
                  {error && <p className="text-sm text-red-600">{error}</p>}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReview("approved")}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                    >
                      Approve (+{selected.quest.rewardStars} ⭐)
                    </button>
                    <button
                      onClick={() => handleReview("rejected")}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                    >
                      Reject
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

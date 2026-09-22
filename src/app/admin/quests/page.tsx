"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Quest {
  id: string;
  title: string;
  description: string;
  rewardStars: number;
  submissionType: string;
  active: boolean;
  removedAt: string | null;
}

export default function AdminQuestsPage() {
  const router = useRouter();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rewardStars, setRewardStars] = useState(10);
  const [submissionType, setSubmissionType] = useState("text");
  const [publishNow, setPublishNow] = useState(false);

  const fetchQuests = useCallback(async () => {
    const res = await fetch("/api/quests?all=1");
    if (res.ok) {
      const data = await res.json();
      setQuests(Array.isArray(data) ? data : []);
    }
  }, []);

  useEffect(() => { fetchQuests(); }, [fetchQuests]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const body = editingId
      ? { title, description, rewardStars, submissionType }
      : { title, description, rewardStars, submissionType, active: publishNow };
    const url = editingId ? `/api/quests/${editingId}` : "/api/quests";
    const method = editingId ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to save quest");
      return;
    }
    resetForm();
    setShowForm(false);
    fetchQuests();
    router.refresh();
  }

  async function handleToggleActive(q: Quest) {
    await fetch(`/api/quests/${q.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !q.active }),
    });
    fetchQuests();
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Deactivate this quest?")) return;
    await fetch(`/api/quests/${id}`, { method: "DELETE" });
    fetchQuests();
    router.refresh();
  }

  function resetForm() {
    setTitle("");
    setDescription("");
    setRewardStars(10);
    setSubmissionType("text");
    setPublishNow(false);
    setEditingId(null);
  }

  function editQuest(q: Quest) {
    setEditingId(q.id);
    setTitle(q.title);
    setDescription(q.description);
    setRewardStars(q.rewardStars);
    setSubmissionType(q.submissionType);
    setShowForm(true);
    window.scrollTo(0, 0);
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Quests</h1>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="bg-star-dark hover:bg-star text-white font-semibold px-4 py-2 rounded-lg text-sm"
        >
          + New Quest
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="bg-white rounded-lg border border-gray-200 p-4 mb-6 space-y-3">
          <h3 className="font-semibold">{editingId ? "Edit Quest" : "New Quest"}</h3>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            required
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description / instructions"
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            required
          />
          <div className="flex gap-3">
            <input
              type="number"
              value={rewardStars}
              onChange={(e) => setRewardStars(Number(e.target.value))}
              min={1}
              className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Stars"
              required
            />
            <select
              value={submissionType}
              onChange={(e) => setSubmissionType(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="text">Text</option>
              <option value="image">Image</option>
            </select>
          </div>
          {!editingId && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={publishNow}
                onChange={(e) => setPublishNow(e.target.checked)}
                className="rounded"
              />
              Publish now (visible to students and announced on Discord)
            </label>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" className="bg-star-dark text-white px-4 py-2 rounded-lg text-sm font-medium">
              {editingId ? "Update" : "Create"}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); resetForm(); }}
              className="border border-gray-300 px-4 py-2 rounded-lg text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {quests.length === 0 ? (
        <p className="text-gray-500">No quests yet. Create one above.</p>
      ) : (
        <div className="space-y-2">
          {quests.map((q) => (
            <div key={q.id} className="bg-white rounded-lg border border-gray-200 p-3 flex items-center justify-between">
              <div className="flex-1">
                <span className="font-medium">{q.title}</span>
                <span className="ml-2 text-sm text-star-dark">{q.rewardStars} ⭐</span>
                <span className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded-full capitalize">{q.submissionType}</span>
                {!q.active && <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">inactive</span>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => editQuest(q)} className="text-sm text-blue-600 hover:underline">Edit</button>
                <button onClick={() => handleToggleActive(q)} className="text-sm text-yellow-600 hover:underline">
                  {q.active ? "Deactivate" : "Activate"}
                </button>
                {!q.removedAt && (
                  <button onClick={() => handleDelete(q.id)} className="text-sm text-red-600 hover:underline">Remove</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

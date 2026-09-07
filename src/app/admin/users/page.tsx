"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  firstName: string;
  discord: string;
  studentNumber: string;
  role: string;
  stars: number;
  active: boolean;
  createdAt: string;
  _count: { submissions: number };
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newPin, setNewPin] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ firstName: "", discord: "", studentNumber: "" });

  const fetchUsers = useCallback(async (q?: string) => {
    const url = q ? `/api/users?search=${encodeURIComponent(q)}` : "/api/users";
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  useEffect(() => {
    const timer = setTimeout(() => { fetchUsers(search); }, 300);
    return () => clearTimeout(timer);
  }, [search, fetchUsers]);

  async function handleAction(id: string, action: string, value?: string | number | boolean) {
    setError("");
    const res = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, value }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Action failed");
      return;
    }
    if (action === "resetPin" && data.newPin) {
      setNewPin(data.newPin);
    }
    fetchUsers(search);
    router.refresh();
  }

  function startEdit(u: User) {
    setError("");
    setEditing(u);
    setEditForm({ firstName: u.firstName, discord: u.discord, studentNumber: u.studentNumber });
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setError("");
    const res = await fetch(`/api/users/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "updateProfile", profile: editForm }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Update failed");
      return;
    }
    setEditing(null);
    fetchUsers(search);
    router.refresh();
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Users</h1>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, Discord, or student #..."
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-64"
        />
      </div>

      {newPin && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 flex items-center justify-between">
          <p className="text-sm">
            <span className="font-medium">New PIN generated:</span>{" "}
            <span className="font-mono text-lg font-bold">{newPin}</span>
            <span className="text-gray-500 ml-2">(tell this to the student)</span>
          </p>
          <button onClick={() => setNewPin(null)} className="text-sm text-gray-500 hover:text-gray-700">Dismiss</button>
        </div>
      )}

      {editing && (
        <div className="bg-star-light border border-star rounded-lg p-4 mb-4">
          <h2 className="font-semibold mb-3">
            Edit {editing.firstName}{" "}
            <span className="text-gray-500 font-normal">({editing.studentNumber})</span>
          </h2>
          <form onSubmit={handleSaveProfile} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div>
              <label className="block text-sm font-medium mb-1">First Name</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-star"
                value={editForm.firstName}
                onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                maxLength={100}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Discord</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-star"
                value={editForm.discord}
                onChange={(e) => setEditForm({ ...editForm, discord: e.target.value })}
                maxLength={100}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Student Number</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-star"
                value={editForm.studentNumber}
                onChange={(e) => setEditForm({ ...editForm, studentNumber: e.target.value })}
                required
                placeholder="e.g. C12345678"
              />
            </div>
            <div className="flex gap-2 sm:col-span-3">
              <button
                type="submit"
                className="bg-star-dark hover:bg-star text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="text-sm text-gray-600 hover:text-gray-800 px-2"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left">
              <th className="py-2 pr-4">Name</th>
              <th className="py-2 pr-4">Discord</th>
              <th className="py-2 pr-4">Student #</th>
              <th className="py-2 pr-4">Role</th>
              <th className="py-2 pr-4">Stars</th>
              <th className="py-2 pr-4">Submissions</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr
                key={u.id}
                className={`border-b border-gray-100 ${
                  selectedId === u.id ? "bg-star-light" : ""
                }`}
                onClick={() => setSelectedId(u.id)}
              >
                <td className="py-2 pr-4 font-medium">{u.firstName}</td>
                <td className="py-2 pr-4 text-gray-500">{u.discord}</td>
                <td className="py-2 pr-4">{u.studentNumber}</td>
                <td className="py-2 pr-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    u.role === "admin" ? "bg-purple-100 text-purple-800" : "bg-gray-100"
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="py-2 pr-4 font-bold text-star-dark">{u.stars}</td>
                <td className="py-2 pr-4">{u._count.submissions}</td>
                <td className="py-2 pr-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    u.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}>
                    {u.active ? "active" : "disabled"}
                  </span>
                </td>
                <td className="py-2">
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => startEdit(u)}
                      className="text-xs text-gray-700 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleAction(u.id, "resetPin")}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Reset PIN
                    </button>
                    <button
                      onClick={() => {
                        const amt = prompt("Adjust stars by (use negative to subtract):");
                        if (amt && !isNaN(Number(amt))) handleAction(u.id, "adjustStars", Number(amt));
                      }}
                      className="text-xs text-star-dark hover:underline"
                    >
                      Stars
                    </button>
                    <button
                      onClick={() => handleAction(u.id, "toggleActive")}
                      className="text-xs text-yellow-600 hover:underline"
                    >
                      {u.active ? "Disable" : "Enable"}
                    </button>
                    <button
                      onClick={() =>
                        handleAction(u.id, "setRole", u.role === "admin" ? "user" : "admin")
                      }
                      className="text-xs text-purple-600 hover:underline"
                    >
                      {u.role === "admin" ? "Demote" : "Promote"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {users.length === 0 && <p className="text-gray-500 mt-4">No users found.</p>}
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  firstName: string;
  lastName: string;
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

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Users</h1>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or student #..."
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

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left">
              <th className="py-2 pr-4">Name</th>
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
                <td className="py-2 pr-4 font-medium">{u.firstName} {u.lastName}</td>
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

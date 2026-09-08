"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ChangePinForm({ role, mustChangePin }: { role: string; mustChangePin: boolean }) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (pin !== pinConfirm) {
      setError("PINs do not match");
      return;
    }
    if (!/^\d{6}$/.test(pin)) {
      setError("PIN must be exactly 6 digits");
      return;
    }
    setLoading(true);

    try {
      const res = await fetch("/api/auth/change-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin, pinConfirm }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }
      router.push(data.user?.role === "admin" ? "/admin" : "/");
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-2 text-center">Set a New PIN</h1>
      <p className="text-sm text-gray-600 mb-6 text-center">
        {mustChangePin
          ? "Your PIN was reset by an admin. Choose a new 6-digit PIN that only you know."
          : "Choose a new 6-digit PIN."}
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">New PIN (6 digits)</label>
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            maxLength={6}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-star"
            required
            autoComplete="new-password"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Confirm New PIN</label>
          <input
            type="password"
            value={pinConfirm}
            onChange={(e) => setPinConfirm(e.target.value)}
            maxLength={6}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-star"
            required
            autoComplete="new-password"
          />
        </div>
        {error && (
          <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-star-dark hover:bg-star text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save New PIN"}
        </button>
      </form>
    </div>
  );
}

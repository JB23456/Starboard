import type { Metadata } from "next";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "Starboard",
  description: "Complete quests, earn stars, climb the leaderboard.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-star-dark">
              Starboard
            </Link>
            <nav className="flex gap-4 text-sm">
              {user?.role === "admin" && (
                <Link href="/admin" className="hover:text-star-dark font-medium">
                  Admin
                </Link>
              )}
              <Link href="/quests" className="hover:text-star-dark font-medium">
                Quests
              </Link>
              <Link href="/leaderboard" className="hover:text-star-dark font-medium">
                Leaderboard
              </Link>
              <Link href="/dashboard" className="hover:text-star-dark font-medium">
                Dashboard
              </Link>
            </nav>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
        <footer className="mt-12 py-4 text-center text-sm text-gray-500">
          Starboard &mdash; Earn stars, climb the board.
        </footer>
      </body>
    </html>
  );
}

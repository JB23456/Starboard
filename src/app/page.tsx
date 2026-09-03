import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import type { User } from "@prisma/client";
import Link from "next/link";
import LogoutButton from "@/components/logout-button";

export const dynamic = "force-dynamic";

function QuestCard({ id, title, description, rewardStars, submissionType }: {
  id: string;
  title: string;
  description: string;
  rewardStars: number;
  submissionType: string;
}) {
  return (
    <Link
      href={`/quests/${id}`}
      className="bg-white border border-gray-200 rounded-lg p-4 hover:border-star-dark hover:shadow transition"
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold">{title}</h3>
        <span className="text-star-dark font-bold text-sm whitespace-nowrap ml-2">
          {rewardStars} ⭐
        </span>
      </div>
      <p className="text-sm text-gray-600 line-clamp-2">{description}</p>
      <span className="inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 capitalize">
        {submissionType}
      </span>
    </Link>
  );
}

async function LoggedInHome({ user }: { user: User }) {
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

  const [newQuests, pendingCount] = await Promise.all([
    prisma.quest.findMany({
      where: { active: true, removedAt: null, createdAt: { gte: twoDaysAgo } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.submission.count({
      where: { userId: user.id, status: "pending" },
    }),
  ]);

  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {user.firstName}</h1>
          <p className="text-gray-600">
            You have <span className="font-bold text-star-dark">{user.stars} stars</span>
            {pendingCount > 0 && (
              <> · {pendingCount} submission{pendingCount === 1 ? "" : "s"} awaiting review</>
            )}
          </p>
        </div>
        <LogoutButton />
      </div>

      <h2 className="text-lg font-semibold mb-3">New Quests</h2>
      {newQuests.length === 0 ? (
        <p className="text-gray-500">
          No new quests in the last 2 days.{" "}
          <Link href="/quests" className="text-star-dark hover:underline">
            See all quests
          </Link>{" "}
          for current challenges.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {newQuests.map((q) => (
            <QuestCard key={q.id} {...q} />
          ))}
        </div>
      )}

      <div className="mt-10 pt-6 border-t border-gray-200">
        <h2 className="text-lg font-semibold mb-3">Explore</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Link
            href="/dashboard"
            className="bg-white border border-gray-200 rounded-lg p-4 hover:border-star-dark hover:shadow transition"
          >
            <h3 className="font-semibold">My Dashboard</h3>
            <p className="text-sm text-gray-600 mt-1">Track your submissions and stars.</p>
          </Link>
          <Link
            href="/quests"
            className="bg-white border border-gray-200 rounded-lg p-4 hover:border-star-dark hover:shadow transition"
          >
            <h3 className="font-semibold">All Quests</h3>
            <p className="text-sm text-gray-600 mt-1">Browse every active quest.</p>
          </Link>
          <Link
            href="/leaderboard"
            className="bg-white border border-gray-200 rounded-lg p-4 hover:border-star-dark hover:shadow transition"
          >
            <h3 className="font-semibold">Leaderboard</h3>
            <p className="text-sm text-gray-600 mt-1">See how you rank against your classmates.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h1 className="text-4xl md:text-5xl font-bold mb-4">
        Earn stars, climb the board.
      </h1>
      <p className="text-lg text-gray-600 mb-8 max-w-lg">
        Complete quests, submit your work, and watch your stars grow. Top students
        make the leaderboard.
      </p>
      <div className="flex gap-4">
        <Link
          href="/signup"
          className="bg-star-dark hover:bg-star text-white font-semibold px-6 py-3 rounded-lg transition"
        >
          Sign Up
        </Link>
        <Link
          href="/login"
          className="border border-gray-300 hover:border-star-dark hover:text-star-dark font-semibold px-6 py-3 rounded-lg transition"
        >
          Log In
        </Link>
      </div>
    </div>
  );
}

export default async function Home() {
  const user = await getSessionUser();
  if (user) return <LoggedInHome user={user} />;
  return <LandingPage />;
}

import { prisma } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function QuestsPage() {
  const quests = await prisma.quest.findMany({
    where: { active: true, removedAt: null },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Quests</h1>
      {quests.length === 0 ? (
        <p className="text-gray-500">No quests available yet. Check back soon!</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quests.map((q) => (
            <Link
              key={q.id}
              href={`/quests/${q.id}`}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:border-star-dark hover:shadow transition"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold">{q.title}</h3>
                <span className="text-star-dark font-bold text-sm whitespace-nowrap ml-2">
                  {q.rewardStars} ⭐
                </span>
              </div>
              <p className="text-sm text-gray-600 line-clamp-2">{q.description}</p>
              <span className="inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 capitalize">
                {q.submissionType}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

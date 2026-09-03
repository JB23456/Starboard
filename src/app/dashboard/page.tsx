import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const submissions = await prisma.submission.findMany({
    where: { userId: user.id },
    include: {
      quest: { select: { id: true, title: true, rewardStars: true, submissionType: true } },
    },
    orderBy: { submittedAt: "desc" },
  });

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {user.firstName}</h1>
          <p className="text-gray-600">
            You have <span className="font-bold text-star-dark">{user.stars} stars</span>
          </p>
        </div>
        <Link
          href="/quests"
          className="bg-star-dark hover:bg-star text-white font-semibold px-4 py-2 rounded-lg text-sm transition"
        >
          View Quests
        </Link>
      </div>

      <h2 className="text-lg font-semibold mb-3">My Submissions</h2>
      {submissions.length === 0 ? (
        <p className="text-gray-500">No submissions yet. <Link href="/quests" className="text-star-dark">Check out the quests!</Link></p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left">
                <th className="py-2 pr-4">Quest</th>
                <th className="py-2 pr-4">Type</th>
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2">Note</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((s) => (
                <tr key={s.id} className="border-b border-gray-100">
                  <td className="py-2 pr-4">
                    <Link href={`/quests/${s.quest.id}`} className="text-star-dark hover:underline">
                      {s.quest.title}
                    </Link>
                  </td>
                  <td className="py-2 pr-4 capitalize">{s.quest.submissionType}</td>
                  <td className="py-2 pr-4">{new Date(s.submittedAt).toLocaleDateString()}</td>
                  <td className="py-2 pr-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[s.status]}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="py-2 text-gray-500">{s.adminNote || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

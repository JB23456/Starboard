import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const [userCount, questCount, pendingCount, totalSubmissions] = await Promise.all([
    prisma.user.count(),
    prisma.quest.count({ where: { active: true, removedAt: null } }),
    prisma.submission.count({ where: { status: "pending" } }),
    prisma.submission.count(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin Overview</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Users</p>
          <p className="text-2xl font-bold">{userCount}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Active Quests</p>
          <p className="text-2xl font-bold">{questCount}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Pending Submissions</p>
          <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Submissions</p>
          <p className="text-2xl font-bold">{totalSubmissions}</p>
        </div>
      </div>
    </div>
  );
}

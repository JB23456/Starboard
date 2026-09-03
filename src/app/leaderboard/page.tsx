import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const user = await getSessionUser();

  const topUsers = await prisma.user.findMany({
    where: { active: true, stars: { gt: 0 } },
    select: { firstName: true, lastName: true, studentNumber: true, stars: true },
    orderBy: { stars: "desc" },
    take: 50,
  });

  const myRank = user && user.stars > 0
    ? await prisma.user.count({
        where: { active: true, stars: { gt: user.stars } },
      }) + 1
    : null;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Leaderboard</h1>

      {myRank && (
        <p className="mb-4 text-sm text-gray-600">
          You are ranked <span className="font-bold text-star-dark">#{myRank}</span>
        </p>
      )}

      {topUsers.length === 0 ? (
        <p className="text-gray-500">No one has earned stars yet. Be the first!</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left">
                <th className="py-2 pr-4 w-12">Rank</th>
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Student #</th>
                <th className="py-2 text-right">Stars</th>
              </tr>
            </thead>
            <tbody>
              {topUsers.map((u, i) => (
                <tr key={u.studentNumber} className="border-b border-gray-100">
                  <td className="py-2 pr-4">
                    {i < 3 ? (
                      <span className="font-bold text-star-dark">#{i + 1}</span>
                    ) : (
                      <span className="text-gray-500">#{i + 1}</span>
                    )}
                  </td>
                  <td className="py-2 pr-4 font-medium">{u.firstName} {u.lastName}</td>
                  <td className="py-2 pr-4 text-gray-500">{u.studentNumber}</td>
                  <td className="py-2 text-right font-bold text-star-dark">{u.stars}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

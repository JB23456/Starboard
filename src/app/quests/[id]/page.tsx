import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { QuestSubmitForm } from "./SubmitForm";

export const dynamic = "force-dynamic";

export default async function QuestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getSessionUser();

  if (!user) redirect("/login");

  const quest = await prisma.quest.findUnique({
    where: { id, removedAt: null },
  });
  if (!quest || !quest.active) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Quest Not Found</h1>
        <Link href="/quests" className="text-star-dark">Back to quests</Link>
      </div>
    );
  }

  const existing = await prisma.submission.findFirst({
    where: { questId: id, userId: user.id, status: { in: ["pending", "approved"] } },
  });

  const rejected = await prisma.submission.findFirst({
    where: { questId: id, userId: user.id, status: "rejected" },
  });

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/quests" className="text-sm text-gray-500 hover:text-gray-700 mb-4">
        &larr; Back
      </Link>
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex justify-between items-start mb-3">
          <h1 className="text-2xl font-bold">{quest.title}</h1>
          <span className="text-star-dark font-bold">{quest.rewardStars} ⭐</span>
        </div>
        <p className="text-gray-700 whitespace-pre-wrap">{quest.description}</p>
        <div className="mt-3">
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 capitalize">
            {quest.submissionType} submission
          </span>
        </div>
      </div>

      {existing ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="font-medium">
            {existing.status === "pending"
              ? "Your submission is pending review."
              : "Your submission was approved. You earned " + quest.rewardStars + " stars!"}
          </p>
        </div>
      ) : rejected ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="font-medium text-red-800">Your previous submission was rejected.</p>
          {rejected.adminNote && (
            <p className="text-sm text-red-600 mt-1">Reason: {rejected.adminNote}</p>
          )}
          <p className="text-sm mt-2">You may resubmit below.</p>
        </div>
      ) : null}

      {!existing && (
        <QuestSubmitForm questId={quest.id} type={quest.submissionType} />
      )}
    </div>
  );
}

import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/dashboard");

  return (
    <div>
      <div className="flex gap-4 mb-6 border-b border-gray-200 pb-3">
        <Link href="/admin" className="text-sm font-medium text-star-dark hover:underline">
          Overview
        </Link>
        <Link href="/admin/quests" className="text-sm font-medium hover:text-star-dark hover:underline">
          Quests
        </Link>
        <Link href="/admin/submissions" className="text-sm font-medium hover:text-star-dark hover:underline">
          Submissions
        </Link>
        <Link href="/admin/users" className="text-sm font-medium hover:text-star-dark hover:underline">
          Users
        </Link>
      </div>
      {children}
    </div>
  );
}

import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminTabs from "@/components/admin-tabs";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/dashboard");

  return (
    <div>
      <AdminTabs />
      {children}
    </div>
  );
}

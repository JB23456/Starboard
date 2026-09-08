import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import ChangePinForm from "./change-pin-form";

export const dynamic = "force-dynamic";

export default async function ChangePinPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  return <ChangePinForm role={user.role} mustChangePin={!!user.mustChangePin} />;
}

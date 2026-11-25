import { Shell } from "@/components/shell";
import { verifiedSubject } from "@/integrations/supabase/session";
import { redirect } from "next/navigation";
import { requireScope } from "@/modules/identity/context";
export const dynamic = "force-dynamic";
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await verifiedSubject())) redirect("/acceso");
  await requireScope();
  return <Shell base="/dashboard">{children}</Shell>;
}

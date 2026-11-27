import { redirect } from "next/navigation";
import ModuleView from "@/components/module-view";
export default async function Page({
  params,
}: {
  params: Promise<{ modulo: string }>;
}) {
  const { modulo } = await params;
  if (modulo === "consorcios") redirect("/dashboard/propiedades");
  if (modulo === "unidades" || modulo === "residentes")
    redirect("/dashboard/propiedades/" + modulo);
  return <ModuleView params={params} base="/dashboard" />;
}

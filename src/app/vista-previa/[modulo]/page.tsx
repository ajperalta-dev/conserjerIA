import ModuleView from "@/components/module-view";
export default function Page({
  params,
}: {
  params: Promise<{ modulo: string }>;
}) {
  return <ModuleView params={params} base="/vista-previa" />;
}

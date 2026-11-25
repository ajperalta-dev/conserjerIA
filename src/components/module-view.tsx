import { notFound } from "next/navigation";
import Link from "next/link";
import { Layers3 } from "lucide-react";
import { modules } from "@/modules/navigation/catalog";
export default async function ModuleView({
  params,
  base = "/vista-previa",
}: {
  params: Promise<{ modulo: string }>;
  base?: string;
}) {
  const { modulo } = await params;
  const item = modules.find(([id]) => id === modulo && id !== "inicio");
  if (!item) notFound();
  return (
    <>
      <small>{item[2].toUpperCase()}</small>
      <h1>{item[1]}</h1>
      <section className="empty">
        <span className="iconBox">
          <Layers3 />
        </span>
        <h2>Módulo pendiente</h2>
        <p>Esta sección se habilitará en una próxima etapa.</p>
        <Link className="outline" href={base}>
          Volver al inicio
        </Link>
      </section>
    </>
  );
}

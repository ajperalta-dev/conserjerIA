import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Building2, House, Users, ArrowUpRight } from "lucide-react";
import { modules, modulePath } from "@/modules/navigation/catalog";
export default function Overview({
  base = "/vista-previa",
}: {
  base?: string;
}) {
  return (
    <>
      <small>ESPACIO DE TRABAJO</small>
      <h1>Inicio</h1>
      <p className="muted">
        {base === "/dashboard"
          ? "Administración del consorcio."
          : "Vista previa de la administración del consorcio."}
      </p>
      <div className="grid3 kpis">
        {[
          [Building2, "Consorcios"],
          [House, "Unidades"],
          [Users, "Residentes"],
        ].map(([IconComponent, title]) => {
          const Icon = IconComponent as typeof House;
          return (
            <Card key={String(title)} className="metric">
              <Icon size={22} />
              <h3>{String(title)}</h3>
              <strong>—</strong>
              <p>Sin datos vinculados</p>
            </Card>
          );
        })}
      </div>
      <h2>Directorio de módulos</h2>
      <table>
        <thead>
          <tr>
            <th>Módulo</th>
            <th>Área</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {modules.slice(1).map(([id, name, group]) => (
            <tr key={id}>
              <td>
                <Link href={modulePath(id, base)}>
                  {name} <ArrowUpRight size={14} />
                </Link>
              </td>
              <td>{group}</td>
              <td>
                <span className="pill">Pendiente</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  House,
  Users,
  Receipt,
  Wallet,
  CreditCard,
  ChartColumn,
  Truck,
  Files,
  Wrench,
  Vote,
  CalendarDays,
  MessagesSquare,
  Sparkles,
  FileChartColumn,
  Settings,
  Search,
  Bell,
  Sun,
  Moon,
  PanelLeft,
  UserRound,
  ChevronDown,
  ChevronRight,
  X,
} from "lucide-react";
import { Brand } from "./brand";
import {
  modules,
  modulePath,
  searchModules,
} from "@/modules/navigation/catalog";
const icons = [
  LayoutDashboard,
  Building2,
  House,
  Users,
  Receipt,
  Wallet,
  CreditCard,
  ChartColumn,
  Truck,
  Files,
  Wrench,
  Vote,
  CalendarDays,
  MessagesSquare,
  Sparkles,
  FileChartColumn,
  Settings,
];
type Panel =
  | "Buscar módulos"
  | "Consorcios disponibles"
  | "Notificaciones"
  | "Perfil"
  | "Navegación";
export function Shell({
  children,
  base = "/vista-previa",
  consortiumName,
}: {
  children: React.ReactNode;
  base?: string;
  consortiumName?: string;
}) {
  const router = useRouter();
  const path = usePathname(),
    current =
      modules.find(
        ([id]) =>
          modulePath(id, base) === path ||
          (["unidades", "residentes"].includes(id) &&
            path.startsWith(modulePath(id, base) + "/")),
      )?.[1] ?? "Inicio";
  const [collapsed, collapse] = useState(false),
    [panel, setPanel] = useState<Panel>("Buscar módulos"),
    [query, search] = useState(""),
    [theme, setTheme] = useState("light"),
    [toast, notify] = useState("");
  const dialog = useRef<HTMLDialogElement>(null),
    timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  function open(name: Panel) {
    setPanel(name);
    search("");
    dialog.current?.showModal();
  }
  useEffect(() => {
    function key(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        open("Buscar módulos");
      }
    }
    const saved =
      localStorage.getItem("conserjeria-theme") ??
      (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.dataset.theme = saved;
    const frame = requestAnimationFrame(() => setTheme(saved));
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("keydown", key);
      cancelAnimationFrame(frame);
      clearTimeout(timer.current);
      delete document.documentElement.dataset.theme;
    };
  }, []);
  function toggle() {
    const value = theme === "dark" ? "light" : "dark";
    setTheme(value);
    localStorage.setItem("conserjeria-theme", value);
    document.documentElement.dataset.theme = value;
    notify(value === "dark" ? "Modo oscuro activado" : "Modo claro activado");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => notify(""), 2400);
  }
  return (
    <div className={"workspace " + (collapsed ? "compact" : "")}>
      <aside>
        <Brand />
        <nav aria-label="Módulos">
          {modules.map(([id, name, group], i) => {
            const Icon = icons[i];
            return (
              <div key={id}>
                {modules[i - 1]?.[2] !== group && <small>{group}</small>}
                <Link
                  title={name}
                  aria-label={name}
                  aria-current={name === current ? "page" : undefined}
                  href={modulePath(id, base)}
                >
                  <Icon size={18} />
                  <span>{name}</span>
                </Link>
              </div>
            );
          })}
        </nav>
      </aside>
      <div className="workbody">
        <header className="toolbar">
          <button
            className="collapse"
            aria-label="Alternar barra lateral"
            onClick={() => collapse(!collapsed)}
          >
            <PanelLeft />
          </button>
          <button
            onClick={() =>
              base === "/dashboard"
                ? router.push("/seleccionar")
                : open("Consorcios disponibles")
            }
          >
            <Building2 /> {consortiumName ?? "Sin consorcio"}{" "}
            <ChevronDown size={14} />
          </button>
          <div className="grow" />
          <button
            aria-label="Buscar módulos"
            onClick={() => open("Buscar módulos")}
          >
            <Search />
            <kbd>Ctrl K</kbd>
          </button>
          <button aria-label="Cambiar tema" onClick={toggle}>
            {theme === "dark" ? <Sun /> : <Moon />}
          </button>
          <button
            aria-label="Notificaciones"
            onClick={() => open("Notificaciones")}
          >
            <Bell />
          </button>
          <button
            aria-label="Perfil"
            onClick={() =>
              base === "/dashboard" ? router.push("/cuenta") : open("Perfil")
            }
          >
            <UserRound />
          </button>
        </header>
        <main className="workmain">
          <nav className="crumb" aria-label="Ruta">
            <Link href={base}>Panel</Link>
            <ChevronRight size={13} />
            {current}
          </nav>
          {children}
        </main>
      </div>
      <nav className="mobile">
        <Link href={base}>
          <House />
          Inicio
        </Link>
        <button onClick={() => open("Buscar módulos")}>
          <Search />
          Buscar
        </button>
        <button onClick={() => open("Navegación")}>
          <PanelLeft />
          Módulos
        </button>
      </nav>
      <dialog ref={dialog} aria-labelledby="dialog-title">
        <div className="spread">
          <h2 id="dialog-title">{panel}</h2>
          <button aria-label="Cerrar" onClick={() => dialog.current?.close()}>
            <X />
          </button>
        </div>
        {panel === "Buscar módulos" || panel === "Navegación" ? (
          <>
            {panel === "Buscar módulos" && (
              <input
                aria-label="Nombre del módulo"
                autoFocus
                placeholder="Buscar por nombre…"
                value={query}
                onChange={(e) => search(e.target.value)}
              />
            )}
            <nav className="results">
              {searchModules(query).map(([id, name]) => (
                <Link
                  key={id}
                  href={modulePath(id, base)}
                  onClick={() => dialog.current?.close()}
                >
                  {name}
                  <ChevronRight size={15} />
                </Link>
              ))}
              {!searchModules(query).length && <p>Sin resultados.</p>}
            </nav>
          </>
        ) : (
          <p>
            {panel === "Perfil"
              ? base === "/dashboard"
                ? "Sesión verificada. La gestión del perfil está pendiente."
                : "Visitante de la vista previa. El acceso con cuenta está pendiente."
              : panel === "Notificaciones"
                ? "No hay notificaciones disponibles."
                : "No hay consorcios vinculados. La selección se habilitará al incorporar membresías."}
          </p>
        )}
      </dialog>
      <div role="status" className={toast ? "toast" : ""}>
        {toast}
      </div>
    </div>
  );
}

import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  ArrowRight,
  MapPin,
  Building2,
  Wallet,
  UsersRound,
} from "lucide-react";
import { Brand } from "@/components/brand";
const areas = [
  {
    icon: Building2,
    title: "Administración",
    body: "Consorcios, unidades y residentes organizados en un solo lugar.",
    id: "consorcios",
  },
  {
    icon: Wallet,
    title: "Gestión financiera",
    body: "Expensas, cobranzas y tesorería para seguir cada movimiento.",
    id: "finanzas",
  },
  {
    icon: UsersRound,
    title: "Comunidad",
    body: "Reservas, asambleas y comunicaciones para la vida en común.",
    id: "comunicaciones",
  },
];
export default function Landing() {
  return (
    <div className="landing">
      <header className="sitehead">
        <Brand />
        <nav>
          <a href="#plataforma">Plataforma</a>
          <Link className="access" href="/dashboard">
            Área privada
          </Link>
          <Link className="outline" href="/vista-previa">
            Explorar el panel <ArrowUpRight size={16} />
          </Link>
        </nav>
      </header>
      <main>
        <section className="hero">
          <div className="heroCopy">
            <span className="location">
              <MapPin size={15} /> Mendoza, Argentina
            </span>
            <h1>
              Administración
              <br />
              <em>inteligente</em>
              <br />
              de edificios<span>.</span>
            </h1>
            <p>
              Un espacio de trabajo para conectar la administración, las
              finanzas y la comunidad de tu consorcio.
            </p>
            <Link className="primary" href="/vista-previa">
              Recorrer la plataforma <ArrowRight size={18} />
            </Link>
          </div>
          <figure>
            <Image
              priority
              src="/brand/mendoza.svg"
              width={900}
              height={640}
              alt="Ilustración arquitectónica de un complejo residencial mendocino"
            />
            <figcaption>
              <span>
                <i /> Arquitectura residencial
              </span>
              <span>Mendoza, AR</span>
            </figcaption>
          </figure>
        </section>
        <section id="plataforma" className="areas">
          <div className="sectionHead">
            <div>
              <small>PLATAFORMA</small>
              <h2>La gestión del consorcio</h2>
            </div>
            <span className="muted">Áreas previstas</span>
          </div>
          <div className="grid3">
            {areas.map(({ icon: Icon, title, body, id }) => (
              <Link className="area" key={id} href={"/vista-previa/" + id}>
                <div className="spread">
                  <span className="iconBox">
                    <Icon />
                  </span>
                  <ArrowUpRight size={18} />
                </div>
                <h3>{title}</h3>
                <p>{body}</p>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <footer>
        <Brand />
        <span>Mendoza · Argentina</span>
      </footer>
    </div>
  );
}

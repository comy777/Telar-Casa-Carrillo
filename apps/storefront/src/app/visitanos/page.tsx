import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Zocalo, claseBoton } from "@telar/ui";
import { Markdown } from "@/components/markdown";
import { FormularioCotizacion } from "@/features/lugar/formulario-cotizacion";
import { getNavigation } from "@/lib/content";
import { getLugar } from "@/lib/lugar";
import { rutaActiva } from "@/lib/navegacion";

export const revalidate = 120;

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getLugar();
  return {
    title: settings.title ?? "Visítanos",
    description: "Ven a la casa de la familia Carrillo: comida, banquitas, ping pong y voleibol. Cotiza tu evento, la visita de tu grupo o el alquiler de una cancha.",
    alternates: { canonical: "/visitanos" },
  };
}

/** Cada actividad lleva una lana del taller como fondo mientras no tenga foto. */
const LANAS = ["var(--pardo)", "var(--oveja)", "var(--nogal)", "var(--crudo)", "var(--negro-lana)", "var(--gris-claro)"];

export default async function Visitanos() {
  const [{ settings: s, activities }, rutas] = await Promise.all([getLugar(), getNavigation()]);
  if (!rutaActiva(rutas, "visitanos")) notFound();

  const horario = s.schedule?.split("\n").map((l) => l.trim()).filter(Boolean) ?? [];
  const tieneDatos = horario.length > 0 || s.address || s.mapUrl;

  return (
    <main>
      <section className="lugar-portada" aria-labelledby="t-lugar">
        <div className="envoltura">
          <div className="lugar-texto">
            <p className="migas">
              <Link href="/">Inicio</Link> / Visítanos
            </p>
            <h1 className="titulo-pagina" id="t-lugar">
              {s.title ?? "Visítanos"}
            </h1>
            {s.intro ? (
              <Markdown texto={s.intro} className="prosa lugar-intro" />
            ) : (
              <p className="lugar-intro">Junto al taller hay un lugar para venir a comer y jugar. Cuéntanos qué planeas y te enviamos una cotización.</p>
            )}
            {activities.length > 0 ? (
              <ul className="lugar-que-hay" aria-label="Lo que hay en el lugar">
                {activities.map((a) => (
                  <li key={a.id}>{a.name}</li>
                ))}
              </ul>
            ) : null}
            <p className="lugar-acciones">
              <a className={claseBoton("accion")} href="#cotizar">
                Pedir una cotización
              </a>
            </p>
          </div>
          <aside className="tabla lugar-tabla" aria-labelledby="t-cuando">
            <h2 id="t-cuando">Cuándo y dónde</h2>
            {tieneDatos ? (
              <dl>
                {horario.length > 0 ? (
                  <>
                    <dt>Horario</dt>
                    {horario.map((linea) => (
                      <dd key={linea}>{linea}</dd>
                    ))}
                  </>
                ) : null}
                {s.address ? (
                  <>
                    <dt>Dirección</dt>
                    <dd>{s.address}</dd>
                  </>
                ) : null}
              </dl>
            ) : (
              <p>Escríbenos y coordinamos el día y la hora de tu visita.</p>
            )}
            {s.mapUrl ? (
              <a className={claseBoton("claro")} href={s.mapUrl} rel="noopener noreferrer" target="_blank">
                Cómo llegar
              </a>
            ) : (
              <Link className={claseBoton("claro")} href="/contacto">
                Escríbenos
              </Link>
            )}
          </aside>
        </div>
      </section>
      <Zocalo />

      {activities.length > 0 ? (
        <section className="seccion" aria-labelledby="t-actividades">
          <div className="envoltura">
            <h2 className="titulo" id="t-actividades">
              Lo que hay para hacer
            </h2>
            <ul className="lugar-actividades">
              {activities.map((a, i) => (
                <li key={a.id} className="actividad" style={{ "--lana": LANAS[i % LANAS.length] } as CSSProperties}>
                  <div className="actividad-foto">
                    {a.imageUrl ? (
                      <Image src={a.imageUrl} alt={a.imageAlt ?? ""} fill sizes="(max-width: 760px) 100vw, 50vw" />
                    ) : (
                      <span className="marca-foto">[Foto real: {a.name}]</span>
                    )}
                  </div>
                  <div className="placa">
                    <h3>{a.name}</h3>
                    {a.description ? <p>{a.description}</p> : null}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <section className="seccion lugar-cotizar" id="cotizar" aria-labelledby="t-cotizar">
        <div className="envoltura">
          <div className="lugar-cotizar-texto">
            <h2 className="titulo" id="t-cotizar">
              Pide tu cotización
            </h2>
            <p>Dinos qué quieres hacer, cuándo y cuántas personas vienen. La familia te responde con el valor y los detalles.</p>
            {s.quoteNote ? <p className="lugar-nota">{s.quoteNote}</p> : null}
          </div>
          <FormularioCotizacion actividades={activities.map((a) => ({ id: a.id, name: a.name }))} />
        </div>
      </section>
    </main>
  );
}

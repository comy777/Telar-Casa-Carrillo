import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EstadoVacio, claseBoton } from "@telar/ui";
import { getPage } from "@/lib/content";
import { Markdown } from "@/components/markdown";

export const revalidate = 300;

type Props = { params: Promise<{ pagina: string }> };

/** Páginas que la tienda enlaza desde el pie y el checkout. Si aún no se publican, se explica en vez de dar 404. */
const ENLAZADAS: Record<string, string> = {
  "terminos-y-condiciones": "Términos y condiciones",
  "tratamiento-de-datos": "Política de tratamiento de datos",
  "derecho-de-retracto": "Derecho de retracto",
  garantias: "Garantías",
  envios: "Envíos",
  "cambios-y-devoluciones": "Cambios y devoluciones",
};

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pagina } = await params;
  if (!SLUG.test(pagina)) return {};
  const p = await getPage(pagina);
  const titulo = p?.title ?? ENLAZADAS[pagina];
  if (!titulo) return { title: "Página no encontrada" };
  return { title: titulo, alternates: { canonical: `/${pagina}` }, robots: p ? undefined : { index: false } };
}

export default async function PaginaContenido({ params }: Props) {
  const { pagina } = await params;
  if (!SLUG.test(pagina)) notFound();
  const p = await getPage(pagina);
  const enlazada = ENLAZADAS[pagina];
  if (!p && !enlazada) notFound();

  return (
    <main className="envoltura seccion-pagina">
      <p className="migas">
        <Link href="/">Inicio</Link> / {p?.title ?? enlazada}
      </p>
      <h1 className="titulo-pagina">{p?.title ?? enlazada}</h1>
      {p ? (
        <>
          <Markdown texto={p.body} className="prosa pagina-texto" />
          <p className="nota-iva pagina-fecha">
            Actualizada el{" "}
            {new Intl.DateTimeFormat("es-CO", { dateStyle: "long", timeZone: "America/Bogota" }).format(new Date(p.updatedAt))}
          </p>
        </>
      ) : (
        <EstadoVacio
          titulo="Estamos terminando este texto"
          accion={
            <Link href="/contacto" className={claseBoton("verde")}>
              Escríbenos
            </Link>
          }
        >
          <p>Si tienes una pregunta sobre este tema, escríbenos y te respondemos directamente.</p>
        </EstadoVacio>
      )}
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { EstadoVacio, claseBoton } from "@telar/ui";
import { getFaqs } from "@/lib/content";
import { Markdown } from "@/components/markdown";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Preguntas frecuentes",
  description: "Envíos, pagos, cambios y cuidado de las piezas de Telar Casa Carrillo.",
  alternates: { canonical: "/preguntas-frecuentes" },
};

export default async function PreguntasFrecuentes() {
  const faqs = await getFaqs();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
  };
  return (
    <main className="envoltura seccion-pagina">
      {faqs.length > 0 ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      ) : null}
      <p className="migas">
        <Link href="/">Inicio</Link> / Preguntas frecuentes
      </p>
      <h1 className="titulo-pagina">Preguntas frecuentes</h1>
      {faqs.length === 0 ? (
        <EstadoVacio
          titulo="Estamos reuniendo las preguntas"
          accion={
            <Link href="/contacto" className={claseBoton("verde")}>
              Escríbenos
            </Link>
          }
        >
          <p>Mientras tanto, cuéntanos tu duda y te respondemos.</p>
        </EstadoVacio>
      ) : (
        <div className="faqs">
          {faqs.map((f) => (
            <details key={f.id} className="faq">
              <summary>{f.question}</summary>
              <Markdown texto={f.answer} />
            </details>
          ))}
          <p className="faq-pie">
            ¿No encontraste tu respuesta? <Link href="/contacto">Escríbenos</Link>.
          </p>
        </div>
      )}
    </main>
  );
}

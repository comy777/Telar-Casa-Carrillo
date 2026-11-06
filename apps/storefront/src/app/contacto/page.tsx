import type { Metadata } from "next";
import Link from "next/link";
import { getStoreSettings } from "@/lib/content";
import { FormularioContacto } from "@/features/content/formulario-contacto";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Contacto",
  description: "Escríbele a la familia Carrillo: pedidos especiales, dudas sobre piezas, envíos o cambios.",
  alternates: { canonical: "/contacto" },
};

export default async function Contacto() {
  const { settings: s } = await getStoreSettings();
  const whatsapp = s?.whatsapp?.replace(/[^\d]/g, "");
  return (
    <main className="envoltura seccion-pagina">
      <p className="migas">
        <Link href="/">Inicio</Link> / Contacto
      </p>
      <h1 className="titulo-pagina">Escríbenos</h1>
      <div className="contacto">
        <FormularioContacto />
        <aside className="tabla contacto-datos" aria-label="Otros medios">
          <h2>Otros medios</h2>
          {s?.contactEmail || s?.contactPhone || whatsapp || s?.location ? (
            <dl>
              {s?.contactEmail ? (
                <>
                  <dt>Correo</dt>
                  <dd>
                    <a href={`mailto:${s.contactEmail}`}>{s.contactEmail}</a>
                  </dd>
                </>
              ) : null}
              {whatsapp ? (
                <>
                  <dt>WhatsApp</dt>
                  <dd>
                    <a href={`https://wa.me/${whatsapp}`} rel="noopener noreferrer" target="_blank">
                      {s?.whatsapp}
                    </a>
                  </dd>
                </>
              ) : null}
              {s?.contactPhone ? (
                <>
                  <dt>Teléfono</dt>
                  <dd>
                    <a href={`tel:${s.contactPhone.replace(/\s/g, "")}`}>{s.contactPhone}</a>
                  </dd>
                </>
              ) : null}
              {s?.location ? (
                <>
                  <dt>Taller</dt>
                  <dd>{s.location}</dd>
                </>
              ) : null}
            </dl>
          ) : (
            <p>Usa el formulario: le llega directo a la familia.</p>
          )}
          <p className="nota">
            ¿Ya compraste? Revisa el estado en <Link href="/cuenta/pedidos">tus pedidos</Link> o con el enlace del correo de confirmación.
          </p>
        </aside>
      </div>
    </main>
  );
}

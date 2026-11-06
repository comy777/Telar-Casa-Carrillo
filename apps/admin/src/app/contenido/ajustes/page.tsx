"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Aviso, Boton, Campo, CampoTexto, Esqueleto, Icono } from "@telar/ui";
import { errorMessage, type Schema } from "@telar/api-client";
import { api } from "@/lib/api-browser";
import { Cabecera } from "@/components/base";
import { ConPermiso } from "@/components/marco";

type Ajustes = Schema<"PublicSettingsResponse">;

export default function AjustesTienda() {
  return (
    <ConPermiso permiso="content:manage">
      <Pantalla />
    </ConPermiso>
  );
}

function Pantalla() {
  const consulta = useQuery({ queryKey: ["ajustes"], queryFn: async () => (await api.GET("/api/v1/admin/content/settings")).data });
  if (consulta.error) return <Aviso tono="error">{errorMessage(consulta.error)}</Aviso>;
  if (!consulta.data) return <Esqueleto alto={480} />;
  return <Formulario inicial={consulta.data} />;
}

function Formulario({ inicial }: { inicial: Ajustes }) {
  const qc = useQueryClient();
  const [d, setD] = useState<Ajustes>(inicial);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const t = (k: keyof Ajustes) => (d[k] as string | null) ?? "";
  const set = (k: keyof Ajustes, v: string) => setD({ ...d, [k]: v || null });

  return (
    <>
      <Cabecera titulo="Ajustes de la tienda" />
      <form
        className="rejilla-2"
        onSubmit={async (e) => {
          e.preventDefault();
          setEnviando(true);
          setError(null);
          setOk(false);
          try {
            const { data } = await api.PUT("/api/v1/admin/content/settings", { body: { ...d, socialLinks: d.socialLinks.filter((r) => r.name && r.url) } });
            if (data) qc.setQueryData(["ajustes"], data);
            setOk(true);
          } catch (err) {
            setError(errorMessage(err));
          } finally {
            setEnviando(false);
          }
        }}
      >
        <section className="panel">
          <h2>Contacto y pie de página</h2>
          {error ? <Aviso tono="error">{error}</Aviso> : null}
          {ok ? <Aviso tono="exito">Guardado. La tienda lo muestra en unos minutos.</Aviso> : null}
          <Campo etiqueta="Descripción corta" value={t("tagline")} onChange={(e) => set("tagline", e.target.value)} maxLength={200} ayuda="Se ve en el pie de página." />
          <Campo etiqueta="Ubicación" value={t("location")} onChange={(e) => set("location", e.target.value)} placeholder="Nobsa, Boyacá" />
          <div className="fila-2">
            <Campo etiqueta="Correo de contacto" type="email" value={t("contactEmail")} onChange={(e) => set("contactEmail", e.target.value)} />
            <Campo etiqueta="Teléfono" value={t("contactPhone")} onChange={(e) => set("contactPhone", e.target.value)} />
          </div>
          <Campo etiqueta="WhatsApp" value={t("whatsapp")} onChange={(e) => set("whatsapp", e.target.value)} placeholder="+57 300 000 0000" />
          <Campo
            etiqueta="Aviso en la parte superior (opcional)"
            value={t("announcement")}
            onChange={(e) => set("announcement", e.target.value)}
            maxLength={160}
            ayuda="Ejemplo: envío gratis desde $ 500.000. Vacío para no mostrar nada."
          />
          <fieldset className="grupo-campos" style={{ border: 0, padding: 0 }}>
            <legend style={{ fontWeight: 700, marginBottom: 8 }}>Redes sociales</legend>
            {d.socialLinks.map((r, i) => (
              <div key={i} className="fila-3">
                <Campo etiqueta="Red" value={r.name} onChange={(e) => setD({ ...d, socialLinks: d.socialLinks.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} />
                <Campo etiqueta="Enlace (https://)" value={r.url} onChange={(e) => setD({ ...d, socialLinks: d.socialLinks.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)) })} />
                <Boton variante="texto" className="casilla-alineada" aria-label="Quitar red" onClick={() => setD({ ...d, socialLinks: d.socialLinks.filter((_, j) => j !== i) })}>
                  <Icono nombre="basura" />
                </Boton>
              </div>
            ))}
            {d.socialLinks.length < 8 ? (
              <Boton variante="borde" onClick={() => setD({ ...d, socialLinks: [...d.socialLinks, { name: "", url: "" }] })}>
                Agregar red
              </Boton>
            ) : null}
          </fieldset>
        </section>
        <section className="panel">
          <h2>Historia del taller</h2>
          <p className="campo-ayuda">Aparece en el inicio. Si queda vacía, la sección no se muestra.</p>
          <Campo etiqueta="Título" value={t("storyTitle")} onChange={(e) => set("storyTitle", e.target.value)} placeholder="El taller de la familia Carrillo" />
          <CampoTexto etiqueta="Texto" rows={14} value={t("storyBody")} onChange={(e) => set("storyBody", e.target.value)} ayuda="Párrafos separados por una línea en blanco." />
          <Boton type="submit" variante="verde" cargando={enviando}>
            Guardar ajustes
          </Boton>
        </section>
      </form>
    </>
  );
}

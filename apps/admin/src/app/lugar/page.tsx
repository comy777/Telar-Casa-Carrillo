"use client";

import Image from "next/image";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Aviso, Boton, Campo, CampoTexto, Casilla, Esqueleto } from "@telar/ui";
import { errorMessage, type Schema } from "@telar/api-client";
import { api } from "@/lib/api-browser";
import { enviarFormulario } from "@/lib/archivos";
import { STOREFRONT_URL } from "@/lib/env";
import { Cabecera, Insignia, SubirImagen, Tabla } from "@/components/base";
import { ConPermiso } from "@/components/marco";

type Ajustes = Schema<"VenueSettingsResponse">;
type Actividad = Schema<"AdminVenueActivityResponse">;

export default function ElLugar() {
  return (
    <ConPermiso permiso="content:manage">
      <Cabecera
        titulo="El lugar"
        acciones={
          <a className="boton boton-borde" href={`${STOREFRONT_URL}/visitanos`} target="_blank" rel="noopener noreferrer">
            Ver en la tienda
          </a>
        }
      >
        <p className="campo-ayuda">Lo que se muestra en «Visítanos»: el texto, el horario, cómo llegar y lo que hay para hacer.</p>
      </Cabecera>
      <div className="rejilla-2">
        <DatosLugar />
        <Actividades />
      </div>
    </ConPermiso>
  );
}

/* ---------- Textos y datos ---------- */

function DatosLugar() {
  const consulta = useQuery({ queryKey: ["lugar-ajustes"], queryFn: async () => (await api.GET("/api/v1/admin/venue/settings")).data });
  if (consulta.error) return <Aviso tono="error">{errorMessage(consulta.error)}</Aviso>;
  if (!consulta.data) return <Esqueleto alto={520} />;
  return <FormularioDatos inicial={consulta.data} />;
}

function FormularioDatos({ inicial }: { inicial: Ajustes }) {
  const qc = useQueryClient();
  const [d, setD] = useState<Ajustes>(inicial);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const t = (k: keyof Ajustes) => d[k] ?? "";
  const set = (k: keyof Ajustes, v: string) => {
    setOk(false);
    setD({ ...d, [k]: v || null });
  };

  return (
    <form
      className="panel"
      onSubmit={async (e) => {
        e.preventDefault();
        setEnviando(true);
        setError(null);
        try {
          const { data } = await api.PUT("/api/v1/admin/venue/settings", { body: d });
          if (data) qc.setQueryData(["lugar-ajustes"], data);
          setOk(true);
        } catch (err) {
          setError(errorMessage(err));
        } finally {
          setEnviando(false);
        }
      }}
    >
      <h2>Textos y datos</h2>
      {error ? <Aviso tono="error">{error}</Aviso> : null}
      {ok ? <Aviso tono="exito">Guardado. La tienda lo muestra en unos minutos.</Aviso> : null}
      <Campo etiqueta="Título" value={t("title")} onChange={(e) => set("title", e.target.value)} maxLength={120} placeholder="Visítanos" ayuda="Vacío: «Visítanos»." />
      <CampoTexto
        etiqueta="Presentación"
        rows={7}
        value={t("intro")}
        onChange={(e) => set("intro", e.target.value)}
        maxLength={6000}
        ayuda="Qué es el lugar y por qué venir. Párrafos separados por una línea en blanco."
      />
      <CampoTexto
        etiqueta="Horario"
        rows={4}
        value={t("schedule")}
        onChange={(e) => set("schedule", e.target.value)}
        maxLength={1000}
        placeholder={"Sábados y domingos: 9:00 a. m. a 6:00 p. m.\nFestivos: 9:00 a. m. a 5:00 p. m."}
        ayuda="Una línea por día o franja."
      />
      <Campo etiqueta="Dirección" value={t("address")} onChange={(e) => set("address", e.target.value)} maxLength={200} />
      <Campo etiqueta="Enlace del mapa" type="url" value={t("mapUrl")} onChange={(e) => set("mapUrl", e.target.value)} placeholder="https://maps.google.com/…" ayuda="Para el botón «Cómo llegar». Debe empezar por https://" />
      <Campo
        etiqueta="Nota junto al formulario de cotización"
        value={t("quoteNote")}
        onChange={(e) => set("quoteNote", e.target.value)}
        maxLength={300}
        placeholder="Respondemos en un día hábil."
        ayuda="También va en el correo de confirmación que recibe quien cotiza."
      />
      <Boton type="submit" variante="verde" cargando={enviando}>
        Guardar
      </Boton>
    </form>
  );
}

/* ---------- Actividades ---------- */

function Actividades() {
  const qc = useQueryClient();
  const [editando, setEditando] = useState<Actividad | "nueva" | null>(null);
  const lista = useQuery({ queryKey: ["lugar-actividades"], queryFn: async () => (await api.GET("/api/v1/admin/venue/activities")).data ?? [] });
  const recargar = () => qc.invalidateQueries({ queryKey: ["lugar-actividades"] });

  return (
    <div className="grupo-campos">
      <section className="panel">
        <div className="panel-cabeza">
          <h2>Lo que hay para hacer</h2>
          <Boton variante="verde" onClick={() => setEditando("nueva")}>
            Nueva actividad
          </Boton>
        </div>
        <p className="campo-ayuda">Comida, banquitas, ping pong, voleibol… Las publicadas salen en la tienda y en el formulario de cotización, en este orden.</p>
        <Tabla
          cargando={lista.isPending}
          error={lista.error}
          filas={lista.data}
          clave={(a) => a.id}
          vacio="Aún no hay actividades."
          columnas={[
            {
              titulo: "Actividad",
              celda: (a) => (
                <button type="button" className="boton boton-texto" onClick={() => setEditando(a)} style={{ gap: 10 }}>
                  <span className="celda-foto">{a.imageUrl ? <Image src={a.imageUrl} alt="" fill sizes="44px" /> : null}</span>
                  {a.name}
                </button>
              ),
            },
            { titulo: "Orden", clase: "num", celda: (a) => a.sortOrder },
            { titulo: "Estado", celda: (a) => (a.isPublished ? <Insignia tono="verde">Publicada</Insignia> : <Insignia>Oculta</Insignia>) },
          ]}
        />
      </section>
      {editando ? (
        <FormularioActividad
          key={editando === "nueva" ? "nueva" : `${editando.id}:${editando.updatedAt}`}
          actividad={editando === "nueva" ? null : editando}
          onCerrar={() => setEditando(null)}
          onGuardado={async (a) => {
            await recargar();
            setEditando(a);
          }}
          onBorrado={async () => {
            await recargar();
            setEditando(null);
          }}
        />
      ) : null}
    </div>
  );
}

function FormularioActividad({
  actividad,
  onCerrar,
  onGuardado,
  onBorrado,
}: {
  actividad: Actividad | null;
  onCerrar: () => void;
  onGuardado: (a: Actividad | null) => Promise<void>;
  onBorrado: () => Promise<void>;
}) {
  const [d, setD] = useState({
    name: actividad?.name ?? "",
    description: actividad?.description ?? "",
    imageAlt: actividad?.imageAlt ?? "",
    sortOrder: String(actividad?.sortOrder ?? 0),
    isPublished: actividad?.isPublished ?? true,
  });
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const ejecutar = async (f: () => Promise<void>) => {
    setError(null);
    try {
      await f();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <form
      className="panel"
      onSubmit={async (e) => {
        e.preventDefault();
        setEnviando(true);
        await ejecutar(async () => {
          const campos = { name: d.name, description: d.description || null, sortOrder: Number(d.sortOrder) || 0, isPublished: d.isPublished };
          if (actividad) {
            const { data } = await api.PATCH("/api/v1/admin/venue/activities/{id}", {
              params: { path: { id: actividad.id } },
              body: { ...campos, imageAlt: d.imageAlt || null } as never,
            });
            await onGuardado(data ?? null);
          } else {
            const { data } = await api.POST("/api/v1/admin/venue/activities", { body: campos as never });
            await onGuardado(data ?? null);
          }
        });
        setEnviando(false);
      }}
    >
      <h2>{actividad ? actividad.name : "Nueva actividad"}</h2>
      {error ? <Aviso tono="error">{error}</Aviso> : null}
      <Campo etiqueta="Nombre" value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} required maxLength={80} placeholder="Banquitas" />
      <CampoTexto
        etiqueta="Descripción"
        rows={3}
        value={d.description}
        onChange={(e) => setD({ ...d, description: e.target.value })}
        maxLength={600}
        ayuda="Una o dos frases: qué hay y para cuántos."
      />
      {actividad ? (
        <>
          {actividad.imageUrl ? (
            <div className="foto-admin" style={{ maxWidth: 320 }}>
              <div className="marco-foto" style={{ aspectRatio: "4 / 3" }}>
                <Image src={actividad.imageUrl} alt={actividad.imageAlt ?? ""} fill sizes="320px" />
              </div>
            </div>
          ) : (
            <p className="campo-ayuda">Sin foto: la tienda muestra el letrero en color lana.</p>
          )}
          <div className="acciones-fila">
            <SubirImagen
              etiqueta={actividad.imageUrl ? "Cambiar foto" : "Subir foto"}
              onArchivo={async (f) => {
                const datos = new FormData();
                datos.append("file", f);
                await onGuardado(await enviarFormulario<Actividad>(`/api/v1/admin/venue/activities/${actividad.id}/image`, "PUT", datos));
              }}
            />
            {actividad.imageUrl ? (
              <Boton
                variante="texto"
                onClick={() =>
                  window.confirm("¿Quitar la foto?") &&
                  void ejecutar(async () => {
                    const { data } = await api.DELETE("/api/v1/admin/venue/activities/{id}/image", { params: { path: { id: actividad.id } } });
                    await onGuardado((data as Actividad | undefined) ?? null);
                  })
                }
              >
                Quitar foto
              </Boton>
            ) : null}
          </div>
          <Campo etiqueta="Texto alternativo de la foto" value={d.imageAlt} onChange={(e) => setD({ ...d, imageAlt: e.target.value })} maxLength={200} ayuda="Describe la foto para quien no la ve." />
        </>
      ) : (
        <p className="campo-ayuda">Después de crearla podrás subir su foto.</p>
      )}
      <div className="fila-2">
        <Campo etiqueta="Orden" type="number" min={0} value={d.sortOrder} onChange={(e) => setD({ ...d, sortOrder: e.target.value })} />
        <Casilla className="casilla-alineada" checked={d.isPublished} onChange={(e) => setD({ ...d, isPublished: e.target.checked })}>
          Publicada
        </Casilla>
      </div>
      <div className="acciones-fila">
        <Boton type="submit" variante="verde" cargando={enviando}>
          {actividad ? "Guardar" : "Crear actividad"}
        </Boton>
        <Boton variante="texto" onClick={onCerrar}>
          Cerrar
        </Boton>
        {actividad ? (
          <Boton
            variante="peligro"
            onClick={() =>
              window.confirm(`¿Borrar «${actividad.name}»? Las cotizaciones ya recibidas conservan su nombre.`) &&
              void ejecutar(async () => {
                await api.DELETE("/api/v1/admin/venue/activities/{id}", { params: { path: { id: actividad.id } } });
                await onBorrado();
              })
            }
          >
            Borrar
          </Boton>
        ) : null}
      </div>
    </form>
  );
}

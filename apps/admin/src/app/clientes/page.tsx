"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Aviso, Boton } from "@telar/ui";
import { errorMessage, type Schema } from "@telar/api-client";
import { api } from "@/lib/api-browser";
import { useSesion } from "@/lib/sesion";
import { Buscador, Cabecera, FiltroSelect, Insignia, Paginador, Tabla, fecha, useFiltros } from "@/components/base";
import { ConPermiso } from "@/components/marco";

type Usuario = Schema<"AdminUserResponse">;
const ESTADOS = { ACTIVE: "Activa", PENDING_VERIFICATION: "Sin confirmar", SUSPENDED: "Suspendida" } as const;

export default function Clientes() {
  return (
    <ConPermiso permiso="users:read">
      <Pantalla />
    </ConPermiso>
  );
}

function Pantalla() {
  const { valores: f, pagina, poner } = useFiltros(["q", "estado"] as const);
  const [elegido, setElegido] = useState<Usuario | null>(null);
  const lista = useQuery({
    queryKey: ["usuarios", f, pagina],
    queryFn: async () =>
      (
        await api.GET("/api/v1/admin/users", {
          params: { query: { page: pagina, pageSize: 25, search: f.q || undefined, status: (f.estado || undefined) as keyof typeof ESTADOS | undefined } },
        })
      ).data,
  });

  return (
    <>
      <Cabecera titulo="Clientes y usuarios">
        <div className="barra-filtros">
          <Buscador valor={f.q} onBuscar={(q) => poner({ q })} etiqueta="Correo o nombre" />
          <FiltroSelect etiqueta="Cuenta" valor={f.estado} opciones={Object.entries(ESTADOS)} onCambio={(estado) => poner({ estado })} />
        </div>
      </Cabecera>
      <div className="rejilla-edicion">
        <div className="grupo-campos">
          <Tabla
            cargando={lista.isPending}
            error={lista.error}
            filas={lista.data?.items}
            clave={(u) => u.id}
            columnas={[
              {
                titulo: "Persona",
                celda: (u) => (
                  <button type="button" className="boton boton-texto" onClick={() => setElegido(u)} style={{ display: "block", textAlign: "left" }}>
                    {u.firstName} {u.lastName}
                    <span className="celda-secundaria">{u.email}</span>
                  </button>
                ),
              },
              { titulo: "Roles", celda: (u) => u.roles.join(", ") },
              { titulo: "Cuenta", celda: (u) => <Insignia tono={u.status === "ACTIVE" ? "verde" : u.status === "SUSPENDED" ? "rojo" : "ambar"}>{ESTADOS[u.status]}</Insignia> },
              { titulo: "Desde", celda: (u) => fecha(u.createdAt) },
            ]}
          />
          <Paginador pagina={pagina} total={lista.data?.total ?? 0} porPagina={25} onCambio={(p) => poner({ pagina: String(p) })} />
        </div>
        {elegido ? <Ficha key={elegido.id} usuario={elegido} onCambio={setElegido} onCerrar={() => setElegido(null)} /> : null}
      </div>
    </>
  );
}

function Ficha({ usuario: u, onCambio, onCerrar }: { usuario: Usuario; onCambio: (u: Usuario) => void; onCerrar: () => void }) {
  const qc = useQueryClient();
  const { puede, usuario: yo } = useSesion();
  const gestionar = puede("users:manage") && yo?.id !== u.id;
  const roles = useQuery({ queryKey: ["roles"], queryFn: async () => (await api.GET("/api/v1/admin/roles")).data ?? [], enabled: puede("roles:read") });
  const [seleccion, setSeleccion] = useState<string[]>(u.roles);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const hacer = async (f: () => Promise<{ data?: Usuario }>, m: string) => {
    setError(null);
    setOk(null);
    try {
      const { data } = await f();
      if (data) onCambio(data);
      setOk(m);
      await qc.invalidateQueries({ queryKey: ["usuarios"] });
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  return (
    <section className="panel">
      <div className="panel-cabeza">
        <h2>
          {u.firstName} {u.lastName}
        </h2>
        <Boton variante="texto" onClick={onCerrar}>
          Cerrar
        </Boton>
      </div>
      {error ? <Aviso tono="error">{error}</Aviso> : null}
      {ok ? <Aviso tono="exito">{ok}</Aviso> : null}
      <dl className="definiciones">
        <dt>Correo</dt>
        <dd>{u.email}</dd>
        <dt>Celular</dt>
        <dd>{u.phone ?? "—"}</dd>
        <dt>Correo confirmado</dt>
        <dd>{fecha(u.emailVerifiedAt)}</dd>
        <dt>Cuenta</dt>
        <dd>{ESTADOS[u.status]}</dd>
      </dl>
      {gestionar ? (
        <>
          <div className="acciones-fila">
            {u.status === "SUSPENDED" ? (
              <Boton variante="verde" onClick={() => hacer(() => api.PATCH("/api/v1/admin/users/{id}/status", { params: { path: { id: u.id } }, body: { action: "reactivate" } }), "Cuenta reactivada.")}>
                Reactivar cuenta
              </Boton>
            ) : (
              <Boton
                variante="peligro"
                onClick={() =>
                  window.confirm("¿Suspender la cuenta? No podrá iniciar sesión.") &&
                  hacer(() => api.PATCH("/api/v1/admin/users/{id}/status", { params: { path: { id: u.id } }, body: { action: "suspend" } }), "Cuenta suspendida.")
                }
              >
                Suspender cuenta
              </Boton>
            )}
          </div>
          {roles.data ? (
            <form
              className="grupo-campos"
              onSubmit={(e) => {
                e.preventDefault();
                void hacer(() => api.PUT("/api/v1/admin/users/{id}/roles", { params: { path: { id: u.id } }, body: { roles: seleccion } }), "Roles actualizados.");
              }}
            >
              <h3>Roles</h3>
              <div className="casillas">
                {roles.data.map((r) => (
                  <label key={r.name}>
                    <input
                      type="checkbox"
                      checked={seleccion.includes(r.name)}
                      onChange={(e) => setSeleccion(e.target.checked ? [...seleccion, r.name] : seleccion.filter((x) => x !== r.name))}
                    />
                    {r.name} <span className="celda-secundaria">{r.description}</span>
                  </label>
                ))}
              </div>
              <Boton type="submit" variante="borde" disabled={seleccion.length === 0}>
                Guardar roles
              </Boton>
            </form>
          ) : null}
        </>
      ) : null}
    </section>
  );
}

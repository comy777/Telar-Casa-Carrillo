"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useRef, useState, type ReactNode } from "react";
import { Aviso, Boton, EstadoVacio, Esqueleto, Icono, cx } from "@telar/ui";
import { errorMessage } from "@telar/api-client";
import { TIPOS_IMAGEN, validarImagen } from "@/lib/archivos";

/* ---------- Cabecera de pantalla ---------- */

export function Cabecera({
  titulo,
  migas,
  acciones,
  children,
}: {
  titulo: string;
  migas?: Array<{ href: string; texto: string }>;
  acciones?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="pantalla-cabeza">
      {migas?.length ? (
        <p className="migas">
          {migas.map((m) => (
            <span key={m.href}>
              <Link href={m.href}>{m.texto}</Link> /{" "}
            </span>
          ))}
          <span aria-current="page">{titulo}</span>
        </p>
      ) : null}
      <div className="pantalla-titulo">
        <h1>{titulo}</h1>
        {acciones ? <div className="acciones-fila">{acciones}</div> : null}
      </div>
      {children}
    </header>
  );
}

/* ---------- Tabla ---------- */

export interface Columna<T> {
  titulo: string;
  celda: (fila: T) => ReactNode;
  clase?: string;
}

export function Tabla<T>({
  columnas,
  filas,
  clave,
  cargando,
  error,
  vacio,
  enlace,
}: {
  columnas: Columna<T>[];
  filas: T[] | undefined;
  clave: (fila: T) => string;
  cargando?: boolean;
  error?: unknown;
  vacio?: ReactNode;
  enlace?: (fila: T) => string;
}) {
  if (cargando) return <Esqueleto alto={280} />;
  if (error) return <Aviso tono="error">{errorMessage(error, "No pudimos cargar la lista.")}</Aviso>;
  if (!filas || filas.length === 0) return <>{vacio ?? <EstadoVacio titulo="No hay nada por aquí todavía" />}</>;
  return (
    <div className="tabla-envoltura">
      <table className="tabla-datos">
        <thead>
          <tr>
            {columnas.map((c) => (
              <th key={c.titulo} scope="col" className={c.clase}>
                {c.titulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => (
            <tr key={clave(f)}>
              {columnas.map((c, i) => (
                <td key={c.titulo} className={c.clase}>
                  {i === 0 && enlace ? (
                    <Link href={enlace(f)} className="celda-enlace">
                      {c.celda(f)}
                    </Link>
                  ) : (
                    c.celda(f)
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- Paginación ---------- */

export function Paginador({ pagina, total, porPagina, onCambio }: { pagina: number; total: number; porPagina: number; onCambio: (p: number) => void }) {
  const paginas = Math.max(1, Math.ceil(total / porPagina));
  if (total <= porPagina) return <p className="total-filas">{total === 1 ? "1 registro" : `${total} registros`}</p>;
  return (
    <div className="paginador">
      <span className="total-filas">{total} registros</span>
      <Boton variante="texto" disabled={pagina <= 1} onClick={() => onCambio(pagina - 1)} aria-label="Página anterior">
        <Icono nombre="chevron-izq" />
      </Boton>
      <span>
        Página {pagina} de {paginas}
      </span>
      <Boton variante="texto" disabled={pagina >= paginas} onClick={() => onCambio(pagina + 1)} aria-label="Página siguiente">
        <Icono nombre="chevron-der" />
      </Boton>
    </div>
  );
}

/* ---------- Filtros en la URL ---------- */

/** Lee y escribe filtros en la URL: las listas se pueden compartir y sobreviven a recargar. */
export function useFiltros<K extends string>(claves: readonly K[]) {
  const sp = useSearchParams();
  const ruta = usePathname();
  const router = useRouter();
  const valores = Object.fromEntries(claves.map((k) => [k, sp.get(k) ?? ""])) as Record<K, string>;
  const pagina = Math.max(1, Number(sp.get("pagina") ?? 1) || 1);
  const poner = useCallback(
    (cambios: Partial<Record<K | "pagina", string>>) => {
      const p = new URLSearchParams(sp.toString());
      for (const [k, v] of Object.entries(cambios) as Array<[string, string | undefined]>) {
        if (v) p.set(k, v);
        else p.delete(k);
      }
      if (!("pagina" in cambios)) p.delete("pagina");
      router.replace(p.toString() ? `${ruta}?${p}` : ruta, { scroll: false });
    },
    [sp, ruta, router],
  );
  return { valores, pagina, poner };
}

export function Buscador({ valor, onBuscar, etiqueta = "Buscar" }: { valor: string; onBuscar: (v: string) => void; etiqueta?: string }) {
  const [texto, setTexto] = useState(valor);
  return (
    <form
      className="buscador"
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        onBuscar(texto.trim());
      }}
    >
      <label className="sr" htmlFor="buscar">
        {etiqueta}
      </label>
      <input id="buscar" type="search" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder={etiqueta} />
      <button type="submit" aria-label="Buscar">
        <Icono nombre="lupa" />
      </button>
    </form>
  );
}

export function FiltroSelect({
  etiqueta,
  valor,
  opciones,
  onCambio,
}: {
  etiqueta: string;
  valor: string;
  opciones: Array<[string, string]>;
  onCambio: (v: string) => void;
}) {
  return (
    <label className="filtro">
      <span>{etiqueta}</span>
      <select value={valor} onChange={(e) => onCambio(e.target.value)}>
        <option value="">Todos</option>
        {opciones.map(([v, t]) => (
          <option key={v} value={v}>
            {t}
          </option>
        ))}
      </select>
    </label>
  );
}

/* ---------- Imagen ---------- */

export function SubirImagen({
  etiqueta = "Subir foto",
  onArchivo,
  multiple = false,
}: {
  etiqueta?: string;
  onArchivo: (f: File) => Promise<void>;
  multiple?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="subir-imagen">
      <input
        ref={input}
        type="file"
        accept={TIPOS_IMAGEN}
        multiple={multiple}
        className="sr"
        onChange={async (e) => {
          const archivos = Array.from(e.target.files ?? []);
          e.target.value = "";
          setError(null);
          for (const f of archivos) {
            const problema = validarImagen(f);
            if (problema) {
              setError(`${f.name}: ${problema}`);
              continue;
            }
            setCargando(true);
            try {
              await onArchivo(f);
            } catch (err) {
              setError(errorMessage(err, "No pudimos subir la foto."));
            } finally {
              setCargando(false);
            }
          }
        }}
      />
      <Boton variante="borde" cargando={cargando} onClick={() => input.current?.click()}>
        <Icono nombre="subir" /> {etiqueta}
      </Boton>
      <span className="campo-ayuda">JPEG, PNG o WebP, hasta 5 MB.</span>
      {error ? (
        <span className="campo-error" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}

/* ---------- Insignias ---------- */

export function Insignia({ tono = "neutro", children }: { tono?: "verde" | "ambar" | "rojo" | "neutro" | "lleno"; children: ReactNode }) {
  return <span className={cx("insignia", `insignia-${tono}`)}>{children}</span>;
}

export const fecha = (iso: string | null | undefined, conHora = false) =>
  iso
    ? new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", ...(conHora ? { timeStyle: "short" } : {}), timeZone: "America/Bogota" }).format(new Date(iso))
    : "—";

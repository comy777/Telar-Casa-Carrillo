import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, Ref, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { useId } from "react";
import { Icono } from "./icons";

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/* ---------- Botones ---------- */

export type VarianteBoton = "accion" | "claro" | "borde" | "verde" | "texto" | "peligro";

export function claseBoton(variante: VarianteBoton = "accion", extra?: string): string {
  return cx("boton", `boton-${variante}`, extra);
}

export function Boton({
  variante = "accion",
  cargando = false,
  className,
  children,
  disabled,
  type = "button",
  ref,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: VarianteBoton;
  cargando?: boolean;
  ref?: Ref<HTMLButtonElement>;
}) {
  return (
    <button
      ref={ref}
      type={type}
      className={claseBoton(variante, className)}
      disabled={disabled || cargando}
      aria-busy={cargando || undefined}
      {...props}
    >
      {cargando ? <span className="hilo-carga" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}

/* ---------- Precio ---------- */

export function formatoPesos(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? Number(value) : (value ?? 0);
  return "$ " + Math.round(n).toLocaleString("es-CO");
}

export function Precio({
  valor,
  antes,
  className,
  claseAntes = "antes",
}: {
  valor: number;
  antes?: number | null;
  className?: string;
  claseAntes?: string;
}) {
  const conDescuento = antes != null && antes > valor;
  return (
    <span className={className}>
      {conDescuento ? <span className="sr">Precio actual: </span> : null}
      {formatoPesos(valor)}
      {conDescuento ? (
        <>
          {" "}
          <s className={claseAntes}>
            <span className="sr">Antes: </span>
            {formatoPesos(antes)}
          </s>
        </>
      ) : null}
    </span>
  );
}

/* ---------- Disponibilidad ---------- */

export type Disponibilidad = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

export function textoDisponibilidad(d: Disponibilidad): string {
  return d === "OUT_OF_STOCK" ? "Agotada" : d === "LOW_STOCK" ? "Últimas unidades" : "Disponible";
}

export function Existencias({ disponibilidad, className }: { disponibilidad: Disponibilidad; className?: string }) {
  return (
    <p
      className={cx(
        "existencias",
        disponibilidad === "LOW_STOCK" && "pocas",
        disponibilidad === "OUT_OF_STOCK" && "agotada",
        className,
      )}
    >
      {textoDisponibilidad(disponibilidad)}
    </p>
  );
}

/* ---------- Formularios ---------- */

interface CampoBase {
  etiqueta: ReactNode;
  error?: string | undefined;
  ayuda?: ReactNode;
  className?: string;
}

export function Campo({
  etiqueta,
  error,
  ayuda,
  className,
  id,
  ref,
  ...props
}: CampoBase & InputHTMLAttributes<HTMLInputElement> & { ref?: Ref<HTMLInputElement> }) {
  const auto = useId();
  const inputId = id ?? auto;
  const ayudaId = `${inputId}-ayuda`;
  const errorId = `${inputId}-error`;
  return (
    <div className={cx("campo", error && "con-error", className)}>
      <label htmlFor={inputId}>{etiqueta}</label>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={cx(ayuda ? ayudaId : null, error ? errorId : null) || undefined}
        {...props}
      />
      {ayuda ? (
        <span className="campo-ayuda" id={ayudaId}>
          {ayuda}
        </span>
      ) : null}
      {error ? (
        <span className="campo-error" id={errorId} role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}

export function CampoSelect({
  etiqueta,
  error,
  ayuda,
  className,
  id,
  children,
  ref,
  ...props
}: CampoBase & SelectHTMLAttributes<HTMLSelectElement> & { ref?: Ref<HTMLSelectElement> }) {
  const auto = useId();
  const inputId = id ?? auto;
  return (
    <div className={cx("campo", error && "con-error", className)}>
      <label htmlFor={inputId}>{etiqueta}</label>
      <select ref={ref} id={inputId} aria-invalid={error ? true : undefined} {...props}>
        {children}
      </select>
      {ayuda ? <span className="campo-ayuda">{ayuda}</span> : null}
      {error ? (
        <span className="campo-error" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}

export function CampoTexto({
  etiqueta,
  error,
  ayuda,
  className,
  id,
  ref,
  ...props
}: CampoBase & TextareaHTMLAttributes<HTMLTextAreaElement> & { ref?: Ref<HTMLTextAreaElement> }) {
  const auto = useId();
  const inputId = id ?? auto;
  return (
    <div className={cx("campo", error && "con-error", className)}>
      <label htmlFor={inputId}>{etiqueta}</label>
      <textarea ref={ref} id={inputId} aria-invalid={error ? true : undefined} {...props} />
      {ayuda ? <span className="campo-ayuda">{ayuda}</span> : null}
      {error ? (
        <span className="campo-error" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}

export function Casilla({
  children,
  error,
  className,
  ref,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { error?: string | undefined; ref?: Ref<HTMLInputElement> }) {
  return (
    <div className={cx("casilla", className)}>
      <label>
        <input ref={ref} type="checkbox" aria-invalid={error ? true : undefined} {...props} />
        <span>{children}</span>
      </label>
      {error ? (
        <span className="campo-error" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}

/* ---------- Avisos y estados ---------- */

export function Aviso({
  tono = "info",
  children,
  className,
}: {
  tono?: "info" | "error" | "exito";
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("aviso", `aviso-${tono}`, className)} role={tono === "error" ? "alert" : "status"}>
      <Icono nombre={tono === "exito" ? "check" : "alerta"} />
      <div>{children}</div>
    </div>
  );
}

export function EstadoVacio({ titulo, children, accion }: { titulo: string; children?: ReactNode; accion?: ReactNode }) {
  return (
    <div className="estado-vacio">
      <div className="pila-vacia" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <h2>{titulo}</h2>
      {children ? <div className="estado-vacio-texto">{children}</div> : null}
      {accion}
    </div>
  );
}

export function Esqueleto({ className, alto }: { className?: string; alto?: number | string }) {
  return <span className={cx("esqueleto", className)} style={alto ? { height: alto } : undefined} aria-hidden="true" />;
}

export function Zocalo() {
  return <div className="zocalo" aria-hidden="true" />;
}

/** Rótulo para contenido que aún no existe (p. ej. una foto real pendiente). */
export function Marcador({ children }: { children: ReactNode }) {
  return <span className="marcador">{children}</span>;
}

export function Cantidad({
  valor,
  min = 1,
  max,
  onCambio,
  etiqueta = "Cantidad",
  disabled,
}: {
  valor: number;
  min?: number;
  max?: number;
  onCambio: (n: number) => void;
  etiqueta?: string;
  disabled?: boolean;
}) {
  const tope = max ?? 99;
  return (
    <div className="cantidad" role="group" aria-label={etiqueta}>
      <button type="button" onClick={() => onCambio(Math.max(min, valor - 1))} disabled={disabled || valor <= min} aria-label="Quitar una">
        <Icono nombre="menos" />
      </button>
      <output aria-live="polite">{valor}</output>
      <button type="button" onClick={() => onCambio(Math.min(tope, valor + 1))} disabled={disabled || valor >= tope} aria-label="Agregar una">
        <Icono nombre="mas" />
      </button>
    </div>
  );
}

import type { SVGProps } from "react";

/** Íconos dibujados: trazo 2, extremos cuadrados, 24×24. */
const TRAZOS = {
  bolsa: (
    <>
      <path d="M5 8h14l-1 13H6L5 8Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </>
  ),
  menu: <path d="M3 7h18M3 12h18M3 17h18" />,
  lupa: (
    <>
      <circle cx="11" cy="11" r="6" />
      <path d="m20 20-4.5-4.5" />
    </>
  ),
  cerrar: <path d="M6 6l12 12M18 6 6 18" />,
  "chevron-der": <path d="m9 6 6 6-6 6" />,
  "chevron-izq": <path d="m15 6-6 6 6 6" />,
  "chevron-abajo": <path d="m6 9 6 6 6-6" />,
  mas: <path d="M12 5v14M5 12h14" />,
  menos: <path d="M5 12h14" />,
  usuario: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1-4 4-6 8-6s7 2 8 6" />
    </>
  ),
  salir: (
    <>
      <path d="M15 4h4v16h-4" />
      <path d="M10 8l-4 4 4 4M6 12h10" />
    </>
  ),
  check: <path d="m5 12 5 5 9-10" />,
  alerta: (
    <>
      <path d="M12 3 2 21h20L12 3Z" />
      <path d="M12 10v5M12 18v.5" />
    </>
  ),
  camion: (
    <>
      <path d="M3 6h11v10H3zM14 10h4l3 3v3h-7" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
    </>
  ),
  basura: <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />,
  editar: <path d="M4 20h4L20 8l-4-4L4 16v4Z" />,
  subir: <path d="M12 16V4M6 10l6-6 6 6M4 20h16" />,
  descargar: <path d="M12 4v12M6 10l6 6 6-6M4 20h16" />,
  ojo: (
    <>
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
} as const;

export type NombreIcono = keyof typeof TRAZOS;

export function Icono({ nombre, ...props }: { nombre: NombreIcono } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={20}
      height={20}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="square"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {TRAZOS[nombre]}
    </svg>
  );
}

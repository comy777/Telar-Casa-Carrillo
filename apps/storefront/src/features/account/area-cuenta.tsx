"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Esqueleto, Icono } from "@telar/ui";
import { useSesion } from "@/features/auth/session-context";

const SECCIONES = [
  { href: "/cuenta", texto: "Mis datos" },
  { href: "/cuenta/pedidos", texto: "Mis pedidos" },
  { href: "/cuenta/direcciones", texto: "Direcciones" },
  { href: "/cuenta/privacidad", texto: "Privacidad" },
];

/**
 * Área privada del cliente. La sesión vive en memoria y en una cookie de la API, así que
 * la protección es en el navegador; la autorización real la hace el backend en cada llamada.
 */
export function AreaCuenta({ titulo, children }: { titulo: string; children: ReactNode }) {
  const { estado, usuario, salir } = useSesion();
  const ruta = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (estado === "invitado") router.replace(`/cuenta/ingresar?volver=${encodeURIComponent(ruta)}`);
  }, [estado, ruta, router]);

  if (estado !== "conectado") {
    return (
      <main className="envoltura cuenta" aria-busy="true">
        <Esqueleto alto={48} />
        <Esqueleto alto={240} />
      </main>
    );
  }

  return (
    <main className="envoltura cuenta">
      <div className="cuenta-cabeza">
        <p className="migas">
          <Link href="/">Inicio</Link> / Tu cuenta
        </p>
        <h1 className="titulo-pagina">{titulo}</h1>
        <p className="cuenta-hola">
          {usuario?.firstName} {usuario?.lastName} · {usuario?.email}
        </p>
      </div>
      <div className="cuenta-cuerpo">
        <nav className="cuenta-nav" aria-label="Secciones de tu cuenta">
          {SECCIONES.map((s) => (
            <Link key={s.href} href={s.href} aria-current={ruta === s.href ? "page" : undefined}>
              {s.texto}
            </Link>
          ))}
          <button
            type="button"
            className="boton-salir"
            onClick={async () => {
              await salir();
              router.replace("/");
            }}
          >
            <Icono nombre="salir" width={18} height={18} /> Cerrar sesión
          </button>
        </nav>
        <div className="cuenta-contenido">{children}</div>
      </div>
    </main>
  );
}

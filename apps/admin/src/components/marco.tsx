"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Esqueleto, Icono } from "@telar/ui";
import { useSesion } from "@/lib/sesion";
import { STOREFRONT_URL } from "@/lib/env";
import { Ingresar } from "./ingresar";

interface Enlace {
  href: string;
  texto: string;
  permiso?: string;
}

const GRUPOS: Array<{ titulo: string; enlaces: Enlace[] }> = [
  { titulo: "", enlaces: [{ href: "/", texto: "Resumen", permiso: "reports:read" }] },
  {
    titulo: "Ventas",
    enlaces: [
      { href: "/pedidos", texto: "Pedidos", permiso: "orders:read" },
      { href: "/pagos", texto: "Pagos", permiso: "payments:read" },
      { href: "/cupones", texto: "Cupones", permiso: "promotions:manage" },
      { href: "/envios", texto: "Métodos de envío", permiso: "shipping:manage" },
    ],
  },
  {
    titulo: "Catálogo",
    enlaces: [
      { href: "/productos", texto: "Productos", permiso: "catalog:read" },
      { href: "/categorias", texto: "Categorías", permiso: "catalog:read" },
      { href: "/artesanos", texto: "Artesanos", permiso: "catalog:read" },
      { href: "/inventario", texto: "Inventario", permiso: "inventory:read" },
    ],
  },
  {
    titulo: "Tienda",
    enlaces: [
      { href: "/contenido/banners", texto: "Banners", permiso: "content:manage" },
      { href: "/contenido/testimonios", texto: "Testimonios", permiso: "content:manage" },
      { href: "/contenido/preguntas", texto: "Preguntas frecuentes", permiso: "content:manage" },
      { href: "/contenido/paginas", texto: "Páginas", permiso: "content:manage" },
      { href: "/contenido/ajustes", texto: "Ajustes de la tienda", permiso: "content:manage" },
      { href: "/mensajes", texto: "Mensajes y boletín", permiso: "messages:read" },
    ],
  },
  {
    titulo: "Administración",
    enlaces: [
      { href: "/clientes", texto: "Clientes y usuarios", permiso: "users:read" },
      { href: "/reportes", texto: "Reportes", permiso: "reports:read" },
      { href: "/auditoria", texto: "Auditoría", permiso: "audit:read" },
      { href: "/sistema", texto: "Estado del sistema", permiso: "reports:read" },
    ],
  },
];

export function Marco({ children }: { children: ReactNode }) {
  const { estado, usuario, puede, salir } = useSesion();
  const ruta = usePathname();
  const [menu, setMenu] = useState(false);
  const [rutaMenu, setRutaMenu] = useState(ruta);
  if (rutaMenu !== ruta) {
    setRutaMenu(ruta);
    setMenu(false);
  }

  if (estado === "cargando") {
    return (
      <div className="admin-cargando" aria-busy="true">
        <Esqueleto alto={60} />
      </div>
    );
  }
  if (estado === "invitado") return <Ingresar />;
  if (!usuario || usuario.permissions.length === 0) {
    return (
      <main className="admin-acceso">
        <div className="tabla">
          <h1>Sin acceso al panel</h1>
          <p>Tu cuenta no tiene permisos de administración. Pide a quien administra la tienda que te asigne un rol.</p>
          <button type="button" className="boton boton-claro" onClick={() => void salir()}>
            Salir
          </button>
        </div>
      </main>
    );
  }

  const activo = (href: string) => (href === "/" ? ruta === "/" : ruta === href || ruta.startsWith(`${href}/`));

  return (
    <div className="admin">
      <aside className={menu ? "admin-nav abierto" : "admin-nav"} aria-label="Panel">
        <div className="admin-marca">
          <Link href="/">Telar Casa Carrillo</Link>
          <span>Panel</span>
        </div>
        <nav id="nav-admin">
          {GRUPOS.map((g) => {
            const visibles = g.enlaces.filter((e) => !e.permiso || puede(e.permiso));
            if (visibles.length === 0) return null;
            return (
              <div key={g.titulo || "inicio"} className="admin-grupo">
                {g.titulo ? <p className="admin-grupo-titulo">{g.titulo}</p> : null}
                {visibles.map((e) => (
                  <Link key={e.href} href={e.href} aria-current={activo(e.href) ? "page" : undefined}>
                    {e.texto}
                  </Link>
                ))}
              </div>
            );
          })}
        </nav>
        <div className="admin-usuario">
          <span>
            {usuario.firstName} {usuario.lastName}
          </span>
          <a href={STOREFRONT_URL} target="_blank" rel="noreferrer">
            Ver la tienda
          </a>
          <button type="button" onClick={() => void salir()}>
            <Icono nombre="salir" width={16} height={16} /> Salir
          </button>
        </div>
      </aside>
      <div className="admin-contenido">
        <div className="admin-barra-movil">
          <button type="button" aria-expanded={menu} aria-controls="nav-admin" onClick={() => setMenu((v) => !v)}>
            <Icono nombre={menu ? "cerrar" : "menu"} /> Menú
          </button>
          <span>Telar Casa Carrillo · Panel</span>
        </div>
        <main id="contenido">{children}</main>
      </div>
    </div>
  );
}

/** Pantalla protegida por permiso: el backend lo exige igual, esto solo evita mostrar algo inútil. */
export function ConPermiso({ permiso, children }: { permiso: string; children: ReactNode }) {
  const { puede } = useSesion();
  if (!puede(permiso)) {
    return (
      <div className="pantalla-vacia">
        <h1>Sin permiso</h1>
        <p>Tu rol no incluye esta sección ({permiso}).</p>
      </div>
    );
  }
  return <>{children}</>;
}

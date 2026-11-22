"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Icono } from "@telar/ui";
// Carrito oculto por ahora: descomentar para volver a vender en línea.
// import { useCarrito } from "@/features/cart/cart-context";
import { useSesion } from "@/features/auth/session-context";
import { useRutaActiva } from "@/features/navigation/navegacion-context";

export interface EnlaceNav {
  href: string;
  texto: string;
}

export function Encabezado({ nombre, enlaces }: { nombre: string; enlaces: EnlaceNav[] }) {
  const ruta = usePathname();
  const [abierto, setAbierto] = useState(false);
  // Carrito oculto por ahora: descomentar para volver a vender en línea.
  // const { carrito, abrir } = useCarrito();
  const { estado, usuario } = useSesion();
  // const piezas = carrito?.itemCount ?? 0;
  const conCuenta = useRutaActiva("cuenta");
  // const conCarrito = useRutaActiva("carrito");

  // Al cambiar de página se cierra el menú (ajuste de estado durante el render, sin efecto).
  const [rutaMenu, setRutaMenu] = useState(ruta);
  if (rutaMenu !== ruta) {
    setRutaMenu(ruta);
    setAbierto(false);
  }

  return (
    <header className="letrero-nav">
      <div className="envoltura">
        <Link className="marca" href="/">
          {nombre}
        </Link>
        <nav id="menu" aria-label="Principal" className={abierto ? "abierto" : undefined}>
          {enlaces.map((e) => (
            <Link key={e.href} href={e.href} aria-current={ruta === e.href ? "page" : undefined}>
              {e.texto}
            </Link>
          ))}
          {conCuenta ? (
            <Link href={estado === "conectado" ? "/cuenta" : "/cuenta/ingresar"} className="enlace-cuenta">
              {estado === "conectado" ? `Hola, ${usuario?.firstName ?? ""}` : "Ingresar"}
            </Link>
          ) : null}
        </nav>
        {/* Carrito oculto por ahora: descomentar para volver a vender en línea.
        {conCarrito ? (
          <button type="button" className="carrito" onClick={abrir} aria-label={`Carrito, ${piezas} ${piezas === 1 ? "pieza" : "piezas"}`}>
            <Icono nombre="bolsa" width={18} height={18} />
            <span className="texto">Carrito</span> {piezas}
          </button>
        ) : null}
        */}
        <button
          type="button"
          className="menu-boton"
          aria-expanded={abierto}
          aria-controls="menu"
          aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
          onClick={() => setAbierto((v) => !v)}
        >
          <Icono nombre={abierto ? "cerrar" : "menu"} width={26} height={26} />
        </button>
      </div>
    </header>
  );
}

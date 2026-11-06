"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Icono } from "@telar/ui";
import { useCarrito } from "@/features/cart/cart-context";
import { useSesion } from "@/features/auth/session-context";
import { STORE_NAME } from "@/lib/env";

export interface EnlaceNav {
  href: string;
  texto: string;
}

export function Encabezado({ enlaces }: { enlaces: EnlaceNav[] }) {
  const ruta = usePathname();
  const [abierto, setAbierto] = useState(false);
  const { carrito, abrir } = useCarrito();
  const { estado, usuario } = useSesion();
  const piezas = carrito?.itemCount ?? 0;

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
          {STORE_NAME}
        </Link>
        <nav id="menu" aria-label="Principal" className={abierto ? "abierto" : undefined}>
          {enlaces.map((e) => (
            <Link key={e.href} href={e.href} aria-current={ruta === e.href ? "page" : undefined}>
              {e.texto}
            </Link>
          ))}
          <Link href={estado === "conectado" ? "/cuenta" : "/cuenta/ingresar"} className="enlace-cuenta">
            {estado === "conectado" ? `Hola, ${usuario?.firstName ?? ""}` : "Ingresar"}
          </Link>
        </nav>
        <button type="button" className="carrito" onClick={abrir} aria-label={`Carrito, ${piezas} ${piezas === 1 ? "pieza" : "piezas"}`}>
          <Icono nombre="bolsa" width={18} height={18} />
          <span className="texto">Carrito</span> {piezas}
        </button>
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

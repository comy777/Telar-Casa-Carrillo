"use client";

import { useEffect } from "react";

/**
 * Apariciones al hacer scroll, en el idioma del puesto: los títulos se pintan como un letrero,
 * las piezas se despliegan como tela y la lista de precios se traza fila por fila.
 *
 * Todo es visible por defecto. Este componente solo marca como "en espera" lo que todavía está
 * debajo del borde de la pantalla, y lo suelta al entrar; si el script no corre, la página se ve
 * completa. Con movimiento reducido no hace nada.
 */
type Tipo = "letra" | "tela" | "letrero" | "retrato" | "fila" | "cita" | "banner" | "historia";

const REGLAS: ReadonlyArray<readonly [selector: string, tipo: Tipo]> = [
  [".seccion h2.titulo, .detalle h2", "letra"],
  [".piezas > .pieza", "tela"],
  [".letreros > .letrero-cat, .lugar-actividades > .actividad", "letrero"],
  [".tejedores > .tejedor-ficha", "retrato"],
  [".precios > li", "fila"],
  [".testimonios > li", "cita"],
  [".letrero-banner > .envoltura", "banner"],
  [".historia > .envoltura", "historia"],
];

/** Separación entre hermanos que entran juntos, y el máximo acumulado. */
const PASO_MS = 70;
const MAX_RETRASO_MS = 420;

/** Tipos cuyo estado de espera recorta al propio elemento. */
const RECORTE_PROPIO = new Set<Tipo>(["letra", "letrero", "cita"]);

export function Movimiento() {
  useEffect(() => {
    if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Qué elementos suelta cada objetivo observado. Los tipos que se recortan a sí mismos
    // (clip-path) se observan por su contenedor: recortados a área cero, el navegador nunca
    // los vería entrar.
    const espera = new Map<Element, HTMLElement[]>();
    const io = new IntersectionObserver(
      (entradas) => {
        // Lo que entra en el mismo cuadro se escalona en el orden del documento.
        const llegan = entradas
          .filter((e) => e.isIntersecting)
          .flatMap((e) => {
            const elementos = espera.get(e.target) ?? [];
            espera.delete(e.target);
            io.unobserve(e.target);
            return elementos;
          })
          .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
        llegan.forEach((el, i) => {
          el.style.setProperty("--retraso", `${Math.min(i * PASO_MS, MAX_RETRASO_MS)}ms`);
          el.removeAttribute("data-espera");
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0 },
    );

    const marcar = () => {
      const borde = window.innerHeight * 0.92;
      let nuevos = false;
      for (const [selector, tipo] of REGLAS) {
        document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
          if (el.dataset.mov) return;
          el.dataset.mov = tipo;
          // Solo espera lo que aún no se ve; lo que ya está en pantalla no parpadea.
          if (el.getBoundingClientRect().top <= borde) return;
          el.setAttribute("data-espera", "");
          const objetivo = (RECORTE_PROPIO.has(tipo) && el.parentElement) || el;
          const lista = espera.get(objetivo);
          if (lista) lista.push(el);
          else {
            espera.set(objetivo, [el]);
            io.observe(objetivo);
          }
          nuevos = true;
        });
      }
      // Fija el estado de espera antes de que el observador lo suelte, para que haya transición.
      if (nuevos) void document.body.offsetHeight;
    };

    marcar();
    // Páginas nuevas (navegación del cliente) y listas que cambian (filtros, "ver más").
    let pendiente = 0;
    const mo = new MutationObserver(() => {
      if (pendiente) return;
      pendiente = requestAnimationFrame(() => {
        pendiente = 0;
        marcar();
      });
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      mo.disconnect();
      io.disconnect();
      cancelAnimationFrame(pendiente);
      // Deja la página visible y sin marcas, para que un nuevo montaje vuelva a empezar.
      document.querySelectorAll<HTMLElement>("[data-mov]").forEach((el) => {
        el.removeAttribute("data-espera");
        delete el.dataset.mov;
      });
    };
  }, []);

  return null;
}

---
version: 1
slug: "prototype-index-html"
primary_target: "prototype/index.html"
related_targets: ["prototype/catalogo.html","prototype/producto.html","apps/storefront"]
---

# Storefront — inicio, catálogo y producto

Scope: tienda pública (inicio, catálogo, ficha de producto). Mode: Persuade (inicio), with catálogo/ficha leaning Operate inside the same world. Prototype in `prototype/` first, then ported to `apps/storefront`.

Audience: colombianos comprando una ruana o una hamaca para sí o para regalar, mayormente en el celular. Job: ver la pieza, saber quién la tejió, confiar en precio y envío, agregar al carrito. Proof on hand: logo, fotos de producto, fotos del taller e historia existen pero aún no están en el repo → espacios marcados, nada inventado.

Unresolved: dominio final; textos reales; fotos reales.

## Direction contract

THESIS: La tienda es el puesto del taller en la plaza: pilas de ruanas dobladas por color de lana y letreros pintados a mano que dicen qué es, quién lo tejió y cuánto vale. Rechaza el banner con titular sobre foto y la fila de cuatro tarjetas iguales.

OWN-WORLD: Muro encalado frío (no crema) como suelo; zócalo y tablas pintadas en verde Boyacá que cargan 30–50 % de la superficie; lana sin teñir (gris oveja, nogal, negro natural, crudo) como bandas apiladas; rojo de puerta colonial solo para la acción. Letras de rotulista en slab pesado para titulares y precios; grotesca sobria para el texto. Color plano, bordes de pincel rectos, sin sombras ni degradados.

STORY: El visitante entiende que es un taller familiar que vende lo que teje, cree el precio porque está pintado con claridad junto al nombre del tejedor, y agrega al carrito sin salir de la primera pantalla.

FIRST VIEWPORT: Barra de letrero verde arriba (marca, Ruanas, Hamacas, La familia, carrito). Izquierda 60 %: pila de bandas de lana (cada banda es una pieza real con su color de lana; en móvil arriba, 4 bandas). Derecha 40 %: tabla pintada verde con nombre de la pieza en slab 56–64 px, «Tejida por …», precio pintado grande y botón rojo puerta «Agregar al carrito». Zócalo verde cierra la pantalla.

FORM: Plaza de Nobsa, candidato 1 de mi lista (IMPECCABLE’S PICK). seed:20833836b515f58b. Signature interaction: al pasar o tocar una banda de la pila, la banda se despliega en la foto de la pieza y la tabla cambia a esa pieza (nombre, tejedor, precio). Motion: despliegue vertical de banda, 240 ms, una vez; sin animaciones dispersas.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

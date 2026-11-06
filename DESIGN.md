---
name: Telar Casa Carrillo
description: Tienda de un taller familiar de telar. Muro encalado, tablas pintadas en verde, lana sin teñir y un solo rojo para comprar.
colors:
  cal: "#f4f4f1"
  cal-sombra: "#e7e7e2"
  verde: "#1e5a3c"
  verde-hondo: "#143f2a"
  verde-claro: "#d5e3d9"
  almagre: "#9e2b25"
  almagre-hondo: "#7d211c"
  tinta: "#1a1a17"
  tinta-suave: "#4a4943"
  blanco: "#ffffff"
  aviso: "#f0c35a"
  crudo: "#d9d2c3"
  gris-claro: "#c4c0b8"
  oveja: "#a39e95"
  pardo: "#8a7560"
  nogal: "#5b4232"
  negro-lana: "#262220"
typography:
  display:
    fontFamily: "Alfa Slab One, Georgia, serif"
    fontSize: "clamp(2rem, 4.2vw, 3.6rem)"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-0.01em"
  display-catalogo:
    fontFamily: "Alfa Slab One, Georgia, serif"
    fontSize: "clamp(2.2rem, 5vw, 4rem)"
    fontWeight: 400
    lineHeight: 1
  headline:
    fontFamily: "Alfa Slab One, Georgia, serif"
    fontSize: "clamp(1.9rem, 4vw, 3.2rem)"
    fontWeight: 400
    lineHeight: 1.05
  precio:
    fontFamily: "Alfa Slab One, Georgia, serif"
    fontSize: "clamp(2rem, 3.6vw, 3rem)"
    fontWeight: 400
    lineHeight: 1
    fontFeature: "tnum"
  title:
    fontFamily: "Alfa Slab One, Georgia, serif"
    fontSize: "1.5rem"
    fontWeight: 400
    lineHeight: 1.05
  precio-etiqueta:
    fontFamily: "Alfa Slab One, Georgia, serif"
    fontSize: "1.2rem"
    fontWeight: 400
    fontFeature: "tnum"
  body-lead:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "clamp(1.05rem, 1.4vw, 1.2rem)"
    fontWeight: 400
    lineHeight: 1.55
  body:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "0.95rem"
    fontWeight: 600
    lineHeight: 1.3
  label-boton:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 700
    letterSpacing: "0.01em"
  caption:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "0.85rem"
    fontWeight: 400
    lineHeight: 1.45
rounded:
  none: "0px"
spacing:
  paso: "8px"
  gutter: "clamp(16px, 4vw, 56px)"
  max: "1360px"
  seccion: "clamp(56px, 8vw, 112px)"
  tabla: "clamp(24px, 3vw, 40px)"
  zocalo: "clamp(28px, 4vw, 44px)"
components:
  letrero-nav:
    backgroundColor: "{colors.verde}"
    textColor: "{colors.cal}"
    typography: "{typography.label}"
    height: "64px"
  carrito:
    backgroundColor: "{colors.cal}"
    textColor: "{colors.verde-hondo}"
    rounded: "{rounded.none}"
    padding: "8px 14px"
  boton-accion:
    backgroundColor: "{colors.almagre}"
    textColor: "{colors.blanco}"
    typography: "{typography.label-boton}"
    rounded: "{rounded.none}"
    padding: "0 24px"
    height: "52px"
  boton-accion-hover:
    backgroundColor: "{colors.almagre-hondo}"
  boton-accion-disabled:
    backgroundColor: "{colors.oveja}"
    textColor: "{colors.cal}"
  boton-claro:
    backgroundColor: "{colors.cal}"
    textColor: "{colors.verde-hondo}"
    typography: "{typography.label-boton}"
    rounded: "{rounded.none}"
    padding: "0 24px"
    height: "52px"
  boton-borde:
    backgroundColor: "transparent"
    textColor: "{colors.verde-hondo}"
    typography: "{typography.label-boton}"
    rounded: "{rounded.none}"
    padding: "0 24px"
    height: "52px"
  boton-borde-hover:
    backgroundColor: "{colors.verde}"
    textColor: "{colors.cal}"
  tabla:
    backgroundColor: "{colors.verde}"
    textColor: "{colors.cal}"
    rounded: "{rounded.none}"
    padding: "{spacing.tabla}"
  banda:
    rounded: "{rounded.none}"
    height: "clamp(56px, 8.4vh, 84px)"
  banda-desplegada:
    height: "clamp(260px, 40vh, 400px)"
  pieza-etiqueta:
    backgroundColor: "{colors.verde}"
    textColor: "{colors.cal}"
    typography: "{typography.precio-etiqueta}"
    padding: "10px 12px"
  pieza-etiqueta-agotada:
    backgroundColor: "{colors.oveja}"
    textColor: "{colors.tinta}"
  letrero-cat-placa:
    backgroundColor: "{colors.verde}"
    textColor: "{colors.cal}"
    padding: "14px 16px"
  letrero-cat-placa-hover:
    backgroundColor: "{colors.verde-hondo}"
  campo:
    backgroundColor: "{colors.blanco}"
    textColor: "{colors.tinta}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "0 12px"
    height: "44px"
  buscar:
    backgroundColor: "{colors.blanco}"
    rounded: "{rounded.none}"
    padding: "0 14px"
    height: "48px"
  paginacion-actual:
    backgroundColor: "{colors.verde}"
    textColor: "{colors.cal}"
    size: "44px"
  zocalo:
    backgroundColor: "{colors.verde}"
    height: "{spacing.zocalo}"
---

# Design System: Telar Casa Carrillo

> **Where these tokens live.** Today the normative values are the `:root` custom properties in `prototype/styles.css`. When the Next.js apps are built, the tokens move to `packages/ui` as a Tailwind v4 `@theme` block (keep the Spanish names verbatim: `--color-verde`, `--color-almagre`, `--font-display`, …) and both `apps/storefront` and `apps/admin` consume them from there. The prototype loads Alfa Slab One and Hanken Grotesk through a Google Fonts `@import`; in the apps the fonts must be self-hosted with `next/font` (no runtime request to Google), exposed as the `--display` / `--texto` font variables.

## Overview

**Creative North Star: "El puesto de la plaza"**

The store is the workshop's stall in the town square: a cold whitewashed wall, boards and a skirting band painted in Boyacá green, folded ruanas stacked by wool color, and hand-lettered signs that say what the piece is, who wove it and what it costs. Everything is flat paint with straight brush edges. Color comes from two places only: the painted green of the stall and the undyed wool of the pieces themselves. A single colonial-door red is reserved for the act of buying.

Density is generous but not airy: sections breathe on a large vertical rhythm, while the painted boards (tabla, etiqueta, placa, tablero) are compact and dense like real signage. Headlines and prices are lettered in a heavy slab; everything a shopper reads to decide is set in a sober grotesk. Green carries a large share of every screen (nav, boards, family band, price board, skirting, footer), so it reads as architecture, not accent.

The world rejects soft depth (drop shadows, blurred gradients, glass), rounded corners, and the stock e-commerce hero of headline-over-photo.

**Key Characteristics:**
- Whitewash floor (`cal`), never cream or beige.
- Boyacá green as structure: boards, sign bars and the zócalo band that closes screens and the page.
- Undyed wool tones as product color: every piece and placeholder is painted in its own wool (`--lana`).
- One red (`almagre`) for actions only.
- Square everything: zero radius, flat fills, hard stops.
- Slab-lettered names and prices with tabular figures; grotesk for the rest.

## Colors

A cold lime-wash ground, a deep painted green, a family of undyed wool neutrals, and one red.

### Primary
- **Verde Boyacá** (`verde`): the painted wood of the stall. Sign bar (nav), the tabla, price tags on product cards, category plaques, the price board, the family section, the zócalo, active pagination, search button, checkbox accent in filters. Text on it is `cal`.
- **Verde hondo** (`verde-hondo`): the shadowed or older paint. Hover state of plaques, the open mobile menu, the zócalo's top edge (6px), footer ground, text on light buttons, portrait placeholders on the green band.
- **Verde claro** (`verde-claro`): chalk on the green board. Secondary text on green (IVA note, strike-through prices, guarantees, legends), the in-stock dot, hairlines on green at 20–30% alpha.

### Secondary
- **Almagre** (`almagre`): the colonial door. The only fill for primary actions (Agregar al carrito, Suscribirme), the global focus ring (3px, 3px offset) and the newsletter consent checkbox accent. White text on it.
- **Almagre hondo** (`almagre-hondo`): hover/press of the action button.

### Tertiary
- **Aviso** (`aviso`): ochre warning paint. Only the "pocas existencias" stock dot and the focus ring on wool swatches sitting on green, where almagre would not read. Currently a hard-coded literal in the CSS; promote it to a custom property when tokens move to `packages/ui`.

### Neutral
- **Cal** (`cal`): the whitewashed wall. Page ground, text on every green and dark surface, light button fill.
- **Cal sombra** (`cal-sombra`): the wall in shade. Placeholder chips (`marcador`), scrollbar track.
- **Tinta** (`tinta`): primary text; text on light wool.
- **Tinta suave** (`tinta-suave`): secondary text on cal (breadcrumbs, card meta, intros).
- **Blanco** (`blanco`): only for text on almagre and for the fill of text inputs on cal.
- **Lana sin teñir**, the product palette, each assigned per piece through the `--lana` custom property (and `--lana-2` for the second stripe of a hamaca):
  - **Crudo** (`crudo`): raw cotton/wool; also text on the nogal workshop image.
  - **Gris claro** (`gris-claro`): light fleece; also the stroke of form fields and secondary copy on the dark newsletter band.
  - **Gris oveja** (`oveja`): sheep grey; also the disabled-button fill, sold-out tag fill and the dashed empty-state border.
  - **Pardo** (`pardo`): brown fleece.
  - **Nogal** (`nogal`): walnut-dyed; also the workshop photo placeholder.
  - **Negro lana** (`negro-lana`): natural black; also the newsletter band ground.

### Named Rules
**The One Door Rule.** Almagre is the action and nothing else: primary buttons and the focus ring. Never a heading, a border, a badge or decoration.

**The Wool Is the Color Rule.** Product surfaces (bands, card photos, category signs, swatches, gallery) take their fill from the piece's own wool via `--lana`, never from the UI palette. When real photos arrive they replace the fill; the wool stays as the loading/background color.

**The Painted Board Rule.** Green is architecture, carrying roughly 30–50% of a screen. Text on green is `cal` (primary) or `verde-claro` (secondary), never `tinta`.

## Typography

**Display Font:** Alfa Slab One (with Georgia, serif)
**Body Font:** Hanken Grotesk 400/500/600/700 (with system-ui, sans-serif)

**Character:** A sign-painter's heavy slab for what is painted on the board (names, prices, section titles) against a quiet, modern grotesk for everything read at length. The slab is always set at weight 400 (its only weight); never fake-bold it.

### Hierarchy
- **Display** (Alfa Slab One 400, clamp(2rem, 4.2vw, 3.6rem), lh 1, −0.01em, balanced wrap): the piece name on the tabla (the page h1 on inicio and ficha). 1.85rem on phones. Catalog h1 uses the larger `display-catalogo` (clamp(2.2rem, 5vw, 4rem)).
- **Headline** (Alfa Slab One 400, clamp(1.9rem, 4vw, 3.2rem), lh 1.05, balanced wrap): section titles.
- **Precio** (Alfa Slab One 400, clamp(2rem, 3.6vw, 3rem), lh 1, tabular figures): the painted price on the tabla. Compare-at price sits beside it in Hanken 1rem, struck through, `verde-claro`.
- **Title** (Alfa Slab One 400, 1.5rem): weaver names, product-detail headings (1.6rem), category plaques (clamp(1.4rem, 2.4vw, 2rem)), price-list values (clamp(1.2rem, 2vw, 1.6rem)). Card price tags use `precio-etiqueta` (1.2rem, tabular).
- **Body** (Hanken 400, 1rem, lh 1.55): all running text; long copy capped at 60–62ch. `body-lead` (clamp(1.05rem, 1.4vw, 1.2rem)) for the workshop story.
- **Label** (Hanken 600–700, 0.9–1rem): nav links (600, 0.95rem), buttons (700, 1rem, +0.01em), card names (700, 1rem), legends, stock line.
- **Caption** (Hanken 400–600, 0.78–0.85rem): IVA note, consent text, photo-pending labels, card meta.

### Named Rules
**The Painted Price Rule.** Every price is in the slab with tabular figures, formatted `$ 289.000` (es-CO). When a piece is sold out the price is replaced by "Agotada" in Hanken 700, not a struck slab.

**The No Small Caps Rule.** No uppercase tracking labels, kickers or eyebrows above titles; the sign says the thing directly.

## Layout

A centered container (`max` 1360px) with a fluid side gutter (`gutter`, 16px → 56px). The base step is `paso` (8px); component spacing uses its multiples (8, 12, 14, 16, 20, 24) and fluid clamps for section rhythm (`seccion`: 56–112px top, 32–64px bottom).

- **First screen (el puesto):** a 3fr / 2fr grid. Left, the pila: a vertical stack of wool bands (6px gap) up to six pieces. Right, the tabla, sticky at 88px and rotated −1deg from its top-right corner on desktop (≥901px). The section fills the viewport (min(100svh − 64px, 980px)) and ends on the zócalo. Under 900px it stacks (pila first, tabla static); under 600px the pila shows 4 bands of 46px.
- **Catalog:** 260px sticky filter column + fluid results grid; filters collapse behind a toggle under 900px.
- **Product grid (piezas):** auto-fill, min 240px columns; forced 2 columns on phones.
- **Category signs:** 3 columns, 1 under 760px. **Weavers:** 3 columns, 2 under 760px.
- **Ficha:** 7fr gallery / 5fr sticky tabla; details in 3 columns below a 6px green rule; all single column under 900px.
- **Price board:** a green tablero with a 2-column price list (1 under 760px), dotted leaders between name and price.
- **Breakpoints:** 600px (phone), 760px (nav collapses to menu, most grids drop), 900px (two-column layouts stack).

### Named Rules
**The Zócalo Rule.** A green skirting band (`zocalo` height, 6px `verde-hondo` top edge) closes the first screen and sits above the footer. It is the stall's wall base, not a divider; use it only to close a screen or the page.

## Elevation & Depth

Flat. There are no drop shadows, no blur and no soft gradients. Depth is painted, the way it would be on a wall:

- **El doblez** (`rgb(0 0 0 / 0.14)` band, 9px; 6px on phones, 12px on the gallery image): a darker strip along the top edge of every wool surface (bands, card photos, gallery, swatches as an inset) that reads as the fold of a folded garment.
- **Hard-stop stripes** (`repeating-linear-gradient` with hard stops only): the fringe (flecos) on ruana bands and the two-color weave on hamaca bands. These are pattern, not gradients.
- **Painted outline** (`box-shadow: inset 0 0 0 2px`): the border of the outline button and pagination cells. Inset, zero blur.
- **Overlap and tilt:** price tags overlap the bottom of card photos (−28px); the tabla tilts −1deg. Sticky elements (nav, tabla, filters) stay flat.

### Named Rules
**The Paint, Not Light Rule.** Depth is a darker flat band or an overlap, never a cast shadow or a blurred gradient.

## Shapes

Every corner is square (`rounded.none`). Edges are straight brush edges: solid fills, 2px strokes on fields and outline controls, 1px translucent hairlines on green (`rgb(213 227 217 / 0.2–0.3)`), a 2px dashed `oveja` border only for honest empty states. Proportions come from the cloth: 4:5 for product photos, portraits on phones and the workshop image; 1:1 for weaver portraits and thumbnails; small rectangles (52×36, 28×18) for wool swatches. Icons are inline 24px SVG strokes, 2px, square caps.

## Components

### Letrero (navigation)
The painted sign bar. Sticky, `verde`, 64px tall. Brand in the slab (clamp(1.15rem, 2.4vw, 1.6rem)) pushed left; links in Hanken 600 0.95rem, `cal`, underlined 2px on hover and when current. The cart is a small `cal` plaque with `verde-hondo` text and a bag icon. Under 760px links collapse behind a menu button into a full-width `verde-hondo` panel with 14px rows and translucent hairlines; the cart keeps only icon and count.

### Buttons
- **Shape:** square (0px), min-height 52px, 24px side padding, Hanken 700 1rem, +0.01em, optional 20px icon with 10px gap.
- **Acción:** `almagre` with white text; hover `almagre-hondo`; disabled `oveja` with `cal` text. Full width inside the tabla.
- **Claro:** `cal` fill, `verde-hondo` text, for use on green boards.
- **Borde:** transparent with a 2px inset `verde` outline and `verde-hondo` text; hover fills `verde` with `cal` text. For secondary actions on cal.
- **Focus:** 3px `almagre` outline, 3px offset, everywhere.

### La tabla (signature board)
The painted price board: `verde` fill, `cal` text, `tabla` padding, 14px vertical gap. Holds, in order: piece name (display), "Tejida en telar por …" with the weaver linked, painted price (+ struck compare-at), IVA/shipping note, stock line with a 10px square dot (`verde-claro` available, `aviso` when 3 or fewer), the action button, and a "Ver la pieza completa" link. On the ficha it also holds wool swatches, quantity stepper and guarantees. Sticky at 88px on desktop; `aria-live="polite"` on inicio.

### La pila (signature interaction)
A stack of wool bands, one per piece in stock. Each band is a full-width button painted in its `--lana`, with the doblez on top, flecos (ruanas) or stripes (hamacas), and a rótulo (name + category · price) on a patch of its own wool at bottom-left. Choosing a band (click/tap, or hover with a 120ms intent delay on hover-capable devices) unfolds it to 260–400px to reveal the piece photo and repaints the tabla with that piece. One band is open at a time (`aria-pressed`). Motion: height, 240ms, `cubic-bezier(0.16, 1, 0.3, 1)`, once; disabled under reduced motion. Hover on closed bands: brightness 1.06.

### Cards (pieza)
- **Photo:** 4:5, `--lana` fill with doblez; sold-out photos desaturate (grayscale 0.6, opacity 0.7).
- **Etiqueta:** a `verde` price tag overlapping the photo bottom (−28px, inset 12px), slab price left, struck compare-at right in `verde-claro`; sold out turns `oveja` with `tinta`.
- **Text:** name Hanken 700 1rem (underlines on hover), meta 0.9rem `tinta-suave` with stock and weaver.
- No border, no shadow, no radius.

### Letrero de categoría
A tall wool-painted sign (clamp(220px, 30vw, 380px)) with a `verde` plaque at its foot carrying the category in the slab and a one-line description in `verde-claro`. Plaque darkens to `verde-hondo` on hover.

### Lista de precios
A green tablero listing every piece: a 28×18 wool swatch, name (Hanken 600), a 2px dotted `verde-claro` leader, and the slab price. Sold-out rows go `verde-claro` and read "Agotada".

### Inputs / Fields
- **Style:** white fill, 2px `gris-claro` stroke, square, min-height 44px, 12px padding, Hanken 1rem; labels Hanken 600 0.85rem above.
- **Focus:** stroke shifts to `verde`.
- **Buscar:** 2px `verde` stroke field fused to a 48px `verde` icon button.
- **On dark (boletín):** transparent fill, 2px `cal` stroke, `gris-claro` placeholder, fused to the action button.
- **Checkboxes/radios:** native, 18px, `accent-color` `verde` (filters) or `almagre` (consent).

### Muestras de lana (variant swatches)
52×36 wool rectangles with an inset doblez. Selected: 3px `cal` outline, 3px offset. Keyboard focus: 3px `aviso` outline. Unavailable: 35% opacity with a diagonal `cal` strike.

### Pagination
44px square cells with a 2px inset `gris-claro` outline; hover outline turns `verde`; current page fills `verde` with `cal` text.

### Photo placeholders
Until real photography arrives, every image slot is its wool fill with a centered bracketed label (`[Foto real: …]`) on a `rgb(26 26 23 / 0.55)` patch in `cal`. Text placeholders use the `marcador` chip (`cal-sombra`, 600, `tinta-suave`). These are scaffolding for missing evidence, not decoration; nothing invented fills them.

## Do's and Don'ts

### Do:
- **Do** paint every product surface with the piece's own wool through `--lana`, with the 9px doblez on top.
- **Do** keep primary actions `almagre` with white text, square, 52px tall, and nothing else red.
- **Do** set names and prices in Alfa Slab One 400 with tabular figures, and the rest in Hanken Grotesk.
- **Do** close the first screen and the page with the zócalo (green band, 6px `verde-hondo` top edge).
- **Do** use `cal` and `verde-claro` for text on green, and keep focus visible (3px `almagre`, or `aviso` where almagre sits on green).
- **Do** keep tap targets at 44px or more and long text at 60–62ch.
- **Do** honor `prefers-reduced-motion`: the band unfold becomes instant.

### Don't:
- **Don't** round corners; every radius is 0.
- **Don't** use drop shadows, blurred or smooth gradients, or glass effects; hard-stop stripes for flecos and hamaca weave are the only gradients allowed.
- **Don't** use a cream or beige ground; the wall is cold `cal`.
- **Don't** put a headline over a full-bleed photo or line up identical cards as the first screen.
- **Don't** add uppercase kickers or eyebrows above titles.
- **Don't** scatter animation; the only motion is the 240ms band unfold.
- **Don't** fill an image or text slot with invented people, testimonials or history; use the marked placeholder.

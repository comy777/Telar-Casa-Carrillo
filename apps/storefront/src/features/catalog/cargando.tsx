import { Esqueleto } from "@telar/ui";

export function CargandoCatalogo() {
  return (
    <div className="catalogo" aria-busy="true" aria-label="Cargando piezas">
      <div className="filtros">
        <Esqueleto alto={44} />
        <Esqueleto alto={120} />
        <Esqueleto alto={80} />
      </div>
      <ul className="piezas">
        {Array.from({ length: 6 }, (_, i) => (
          <li key={i} className="pieza">
            <Esqueleto className="foto-pieza" />
            <Esqueleto alto={18} />
            <Esqueleto alto={14} />
          </li>
        ))}
      </ul>
    </div>
  );
}

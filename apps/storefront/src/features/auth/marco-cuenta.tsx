import type { ReactNode } from "react";

/** Marco de las pantallas de acceso: tabla pintada sobre el muro, sin distracciones. */
export function MarcoAcceso({ titulo, children, pie }: { titulo: string; children: ReactNode; pie?: ReactNode }) {
  return (
    <main className="envoltura acceso">
      <div className="tabla acceso-tabla">
        <h1>{titulo}</h1>
        {children}
      </div>
      {pie ? <div className="acceso-pie">{pie}</div> : null}
    </main>
  );
}

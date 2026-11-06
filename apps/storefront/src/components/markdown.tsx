import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Markdown limitado y seguro para textos del panel: ## títulos, párrafos, listas (- o 1.),
 * **negrita**, *cursiva* y [enlaces](/ruta o https://...). No interpreta HTML: todo es texto.
 */
export function Markdown({ texto, className = "prosa" }: { texto: string; className?: string }) {
  const bloques = texto.replace(/\r\n/g, "\n").split(/\n{2,}/);
  return (
    <div className={className}>
      {bloques.map((bloque, i) => {
        const lineas = bloque.split("\n").filter((l) => l.trim() !== "");
        if (lineas.length === 0) return null;
        const primera = lineas[0]!;
        const titulo = /^(#{2,3})\s+(.*)$/.exec(primera);
        if (titulo && lineas.length === 1) {
          return titulo[1] === "##" ? <h2 key={i}>{enLinea(titulo[2]!)}</h2> : <h3 key={i}>{enLinea(titulo[2]!)}</h3>;
        }
        if (lineas.every((l) => /^\s*[-*]\s+/.test(l))) {
          return (
            <ul key={i}>
              {lineas.map((l, j) => (
                <li key={j}>{enLinea(l.replace(/^\s*[-*]\s+/, ""))}</li>
              ))}
            </ul>
          );
        }
        if (lineas.every((l) => /^\s*\d+[.)]\s+/.test(l))) {
          return (
            <ol key={i}>
              {lineas.map((l, j) => (
                <li key={j}>{enLinea(l.replace(/^\s*\d+[.)]\s+/, ""))}</li>
              ))}
            </ol>
          );
        }
        return (
          <p key={i}>
            {lineas.map((l, j) => (
              <span key={j}>
                {j > 0 ? <br /> : null}
                {enLinea(l)}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

const ENLACE_SEGURO = /^(\/(?!\/)|https:\/\/|mailto:)/;

function enLinea(texto: string): ReactNode[] {
  const out: ReactNode[] = [];
  const patron = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let ultimo = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = patron.exec(texto))) {
    if (m.index > ultimo) out.push(texto.slice(ultimo, m.index));
    if (m[1] && m[2]) {
      const href = m[2];
      if (!ENLACE_SEGURO.test(href)) out.push(m[1]);
      else if (href.startsWith("/")) out.push(<Link key={k++} href={href}>{m[1]}</Link>);
      else out.push(<a key={k++} href={href} rel="noopener noreferrer">{m[1]}</a>);
    } else if (m[3]) out.push(<strong key={k++}>{m[3]}</strong>);
    else if (m[4]) out.push(<em key={k++}>{m[4]}</em>);
    ultimo = patron.lastIndex;
  }
  if (ultimo < texto.length) out.push(texto.slice(ultimo));
  return out;
}

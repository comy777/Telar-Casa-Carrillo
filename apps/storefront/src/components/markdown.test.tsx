import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Markdown } from "./markdown";

describe("Markdown", () => {
  it("convierte títulos, listas, negrita y enlaces internos", () => {
    render(<Markdown texto={"## Envíos\n\nLlega en **3 a 6 días**.\n\n- Bogotá\n- Tunja\n\nLee [la política](/envios)."} />);
    expect(screen.getByRole("heading", { level: 2, name: "Envíos" })).toBeInTheDocument();
    expect(screen.getByText("3 a 6 días").tagName).toBe("STRONG");
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByRole("link", { name: "la política" })).toHaveAttribute("href", "/envios");
  });

  it("no ejecuta HTML ni enlaces peligrosos", () => {
    const { container } = render(<Markdown texto={'<img src=x onerror=alert(1)> [clic](javascript:alert(1)) [sitio](//malo.com)'} />);
    expect(container.querySelector("img")).toBeNull();
    expect(screen.queryByRole("link")).toBeNull();
    expect(container.textContent).toContain("<img src=x onerror=alert(1)>");
  });
});

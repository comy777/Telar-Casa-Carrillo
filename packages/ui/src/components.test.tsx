import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Campo, Cantidad, Existencias, Precio, formatoPesos } from "./index";

describe("formatoPesos", () => {
  it("usa separador de miles colombiano y sin decimales", () => {
    expect(formatoPesos(289000)).toBe("$ 289.000");
    expect(formatoPesos("1234567.4")).toBe("$ 1.234.567");
  });
});

describe("Precio", () => {
  it("anuncia el precio anterior a lectores de pantalla solo si es mayor", () => {
    const { rerender } = render(<Precio valor={319000} antes={349000} />);
    expect(screen.getByText(/Antes:/)).toBeInTheDocument();
    rerender(<Precio valor={319000} antes={300000} />);
    expect(screen.queryByText(/Antes:/)).not.toBeInTheDocument();
  });
});

describe("Existencias", () => {
  it("traduce la disponibilidad del backend", () => {
    render(<Existencias disponibilidad="LOW_STOCK" />);
    expect(screen.getByText("Últimas unidades")).toHaveClass("pocas");
  });
});

describe("Cantidad", () => {
  it("respeta el mínimo y el máximo", async () => {
    const onCambio = vi.fn();
    render(<Cantidad valor={3} max={3} onCambio={onCambio} />);
    expect(screen.getByRole("button", { name: "Agregar una" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Quitar una" }));
    expect(onCambio).toHaveBeenCalledWith(2);
  });
});

describe("Campo", () => {
  it("asocia la etiqueta y el error al input", () => {
    render(<Campo etiqueta="Correo" error="Escribe un correo válido" />);
    const input = screen.getByLabelText("Correo");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Escribe un correo válido");
  });
});

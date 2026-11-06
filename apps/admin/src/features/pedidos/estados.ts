export const ESTADOS_PEDIDO = {
  PENDING_PAYMENT: "Esperando pago",
  PAID: "Pagado",
  PROCESSING: "En preparación",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
  REFUNDED: "Reembolsado",
} as const;

export type EstadoPedido = keyof typeof ESTADOS_PEDIDO;

export const TONO_PEDIDO: Record<EstadoPedido, "verde" | "ambar" | "rojo" | "neutro" | "lleno"> = {
  PENDING_PAYMENT: "ambar",
  PAID: "verde",
  PROCESSING: "verde",
  SHIPPED: "lleno",
  DELIVERED: "lleno",
  CANCELLED: "neutro",
  REFUNDED: "rojo",
};

/** Transiciones que el panel ofrece (el backend valida la tabla completa). */
export const SIGUIENTES: Partial<Record<EstadoPedido, Array<"PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED">>> = {
  PENDING_PAYMENT: ["CANCELLED"],
  PAID: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
};

export const ESTADOS_PAGO = {
  PENDING: "Pendiente",
  APPROVED: "Aprobado",
  DECLINED: "Rechazado",
  VOIDED: "Anulado",
  PARTIALLY_REFUNDED: "Reembolso parcial",
  REFUNDED: "Reembolsado",
  ERROR: "Error",
} as const;

export const ESTADOS_ENVIO = {
  PENDING: "Por despachar",
  READY: "Listo",
  IN_TRANSIT: "En camino",
  DELIVERED: "Entregado",
  FAILED: "Entrega fallida",
  RETURNED: "Devuelto",
} as const;

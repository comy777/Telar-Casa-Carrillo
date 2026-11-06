"use client";

import { useSyncExternalStore } from "react";
import { session } from "./api-browser";
import { tomarTokenDeUrl } from "./formularios";

/**
 * Token de acceso de un pedido de invitado (llega en el correo y al crear el pedido).
 * Se envía en la cabecera X-Order-Token, nunca en la URL. Se guarda solo en esta pestaña
 * (sessionStorage) para sobrevivir a la vuelta de la pasarela de pago.
 */
const clave = (numero: string) => `tcc:pedido:${numero}`;

export function guardarTokenPedido(numero: string, token: string): void {
  try {
    sessionStorage.setItem(clave(numero), token);
  } catch {
    // almacenamiento bloqueado: queda solo en memoria
  }
  session.setGuestOrderToken(token);
}

const activados = new Map<string, string | null>();
const sinSuscripcion = () => () => undefined;

/**
 * Activa el token del pedido antes de pedir datos: undefined mientras hidrata (servidor),
 * luego el token (o null si no hay). Se calcula una sola vez por pedido.
 */
export function useTokenPedido(numero: string): string | null | undefined {
  return useSyncExternalStore(
    sinSuscripcion,
    () => {
      if (!activados.has(numero)) activados.set(numero, activarTokenPedido(numero));
      return activados.get(numero) ?? null;
    },
    () => undefined,
  );
}

/** Toma el token de la URL (y lo borra de ella) o el guardado para este pedido. */
export function activarTokenPedido(numero: string): string | null {
  const deUrl = tomarTokenDeUrl();
  if (deUrl) {
    guardarTokenPedido(numero, deUrl);
    return deUrl;
  }
  let guardado: string | null = null;
  try {
    guardado = sessionStorage.getItem(clave(numero));
  } catch {
    guardado = null;
  }
  if (guardado) session.setGuestOrderToken(guardado);
  return guardado;
}

"use client";

import { useState } from "react";
import { Aviso, Boton, Campo } from "@telar/ui";
import { errorMessage, isApiError } from "@telar/api-client";
import { useSesion } from "@/lib/sesion";

export function Ingresar() {
  const { ingresar } = useSesion();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <main className="admin-acceso">
      <form
        className="tabla formulario"
        onSubmit={async (e) => {
          e.preventDefault();
          setCargando(true);
          setError(null);
          try {
            await ingresar(email, password);
          } catch (err) {
            setError(isApiError(err) && err.status === 401 ? "El correo o la contraseña no coinciden." : errorMessage(err));
          } finally {
            setCargando(false);
          }
        }}
      >
        <h1>Panel de Telar Casa Carrillo</h1>
        {error ? <Aviso tono="error">{error}</Aviso> : null}
        <Campo etiqueta="Correo" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Campo
          etiqueta="Contraseña"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Boton type="submit" variante="claro" cargando={cargando}>
          Ingresar
        </Boton>
      </form>
    </main>
  );
}

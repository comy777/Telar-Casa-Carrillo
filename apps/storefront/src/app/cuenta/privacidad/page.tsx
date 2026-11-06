"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Aviso, Boton, Campo } from "@telar/ui";
import { errorMessage, isApiError } from "@telar/api-client";
import { api, session } from "@/lib/api-browser";
import { AreaCuenta } from "@/features/account/area-cuenta";

export default function Privacidad() {
  const router = useRouter();
  const [descargando, setDescargando] = useState(false);
  const [clave, setClave] = useState("");
  const [confirmo, setConfirmo] = useState(false);
  const [borrando, setBorrando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <AreaCuenta titulo="Privacidad y datos">
      <section className="tarjeta-cuenta" aria-labelledby="t-exportar">
        <h2 id="t-exportar">Descarga tus datos</h2>
        <p>
          Por la Ley 1581 de 2012 puedes conocer los datos personales que guardamos de ti. Descárgalos en un archivo JSON.
        </p>
        <Boton
          variante="borde"
          cargando={descargando}
          onClick={async () => {
            setDescargando(true);
            setError(null);
            try {
              const { data } = await api.GET("/api/v1/account/data");
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "mis-datos-telar-casa-carrillo.json";
              a.click();
              URL.revokeObjectURL(url);
            } catch (e) {
              setError(errorMessage(e));
            } finally {
              setDescargando(false);
            }
          }}
        >
          Descargar mis datos
        </Boton>
      </section>

      <section className="tarjeta-cuenta zona-peligro" aria-labelledby="t-borrar">
        <h2 id="t-borrar">Borrar mi cuenta</h2>
        <p>
          Cerramos tu cuenta y borramos tus direcciones, sesiones y carrito. Los pedidos y facturas se conservan, desligados de
          tu cuenta, porque la ley exige guardarlos como soporte contable. Si tienes un pedido en curso, espera a que termine.
          Lee la <Link href="/tratamiento-de-datos">política de tratamiento de datos</Link>.
        </p>
        {error ? <Aviso tono="error">{error}</Aviso> : null}
        <form
          className="formulario"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!confirmo) return setError("Marca la casilla para confirmar que quieres borrar la cuenta.");
            setBorrando(true);
            setError(null);
            try {
              await api.DELETE("/api/v1/account", { body: { password: clave } });
              session.setAccessToken(null);
              router.replace("/?cuenta=borrada");
            } catch (err) {
              setError(isApiError(err) && err.status === 401 ? "La contraseña no es correcta." : errorMessage(err));
            } finally {
              setBorrando(false);
            }
          }}
        >
          <Campo etiqueta="Tu contraseña" type="password" autoComplete="current-password" value={clave} onChange={(e) => setClave(e.target.value)} required />
          <label className="casilla">
            <span>
              <input type="checkbox" checked={confirmo} onChange={(e) => setConfirmo(e.target.checked)} /> Entiendo que no se puede deshacer
            </span>
          </label>
          <Boton type="submit" variante="peligro" cargando={borrando}>
            Borrar mi cuenta
          </Boton>
        </form>
      </section>
    </AreaCuenta>
  );
}

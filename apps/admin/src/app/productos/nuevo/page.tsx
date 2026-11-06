"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Boton, Campo } from "@telar/ui";
import { api } from "@/lib/api-browser";
import { Cabecera } from "@/components/base";
import { ConPermiso } from "@/components/marco";
import { aApi, CamposProducto, useGuardar, vacio } from "@/features/catalogo/formulario-producto";

export default function NuevoProducto() {
  return (
    <ConPermiso permiso="catalog:manage">
      <Formulario />
    </ConPermiso>
  );
}

function Formulario() {
  const router = useRouter();
  const [datos, setDatos] = useState(vacio);
  const [precio, setPrecio] = useState("");
  const [antes, setAntes] = useState("");
  const [enviando, setEnviando] = useState(false);
  const { ejecutar, avisos } = useGuardar();

  return (
    <>
      <Cabecera titulo="Nuevo producto" migas={[{ href: "/productos", texto: "Productos" }]} />
      <form
        className="rejilla-edicion"
        onSubmit={async (e) => {
          e.preventDefault();
          setEnviando(true);
          let id: string | undefined;
          await ejecutar(async () => {
            const { data } = await api.POST("/api/v1/admin/products", {
              body: {
                ...aApi(datos),
                variants: [
                  {
                    name: "Única",
                    sku: `${datos.sku.trim()}-1`,
                    price: Number(precio),
                    compareAtPrice: antes ? Number(antes) : null,
                    isActive: true,
                  },
                ],
              },
            });
            id = data?.id;
          });
          setEnviando(false);
          if (id) router.replace(`/productos/${id}?nuevo=1`);
        }}
      >
        <section className="panel">
          <h2>Datos de la pieza</h2>
          {avisos}
          <CamposProducto datos={datos} onCambio={setDatos} />
        </section>
        <aside className="panel">
          <h2>Precio</h2>
          <p className="campo-ayuda">
            Pesos colombianos con IVA incluido. Después de crearlo podrás agregar variantes (colores, tallas), fotos e inventario.
          </p>
          <Campo etiqueta="Precio" type="number" min={0} step={100} value={precio} onChange={(e) => setPrecio(e.target.value)} required />
          <Campo
            etiqueta="Precio anterior (opcional)"
            type="number"
            min={0}
            step={100}
            value={antes}
            onChange={(e) => setAntes(e.target.value)}
            ayuda="Si lo pones, la tienda muestra el precio tachado."
          />
          <Boton type="submit" variante="verde" cargando={enviando}>
            Crear como borrador
          </Boton>
        </aside>
      </form>
    </>
  );
}

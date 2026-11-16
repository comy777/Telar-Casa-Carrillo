"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Boton, Campo } from "@telar/ui";
import { api } from "@/lib/api-browser";
import { subirFotosProducto } from "@/lib/archivos";
import { Cabecera } from "@/components/base";
import { ConPermiso } from "@/components/marco";
import { aApi, CamposProducto, useGuardar, vacio } from "@/features/catalogo/formulario-producto";
import { SelectorFotos } from "@/features/catalogo/selector-fotos";

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
  const [fotos, setFotos] = useState<File[]>([]);
  const [paso, setPaso] = useState<string | null>(null);
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
          setPaso("Creando el producto…");
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
          if (!id) {
            setEnviando(false);
            setPaso(null);
            return;
          }
          // El producto ya existe: si las fotos fallan, se avisa en la edición para reintentarlas allí.
          let fotosFallaron = false;
          if (fotos.length) {
            setPaso(fotos.length === 1 ? "Subiendo la foto…" : `Subiendo ${fotos.length} fotos…`);
            try {
              await subirFotosProducto(id, fotos);
            } catch {
              fotosFallaron = true;
            }
          }
          router.replace(`/productos/${id}?nuevo=1${fotosFallaron ? "&fotos=error" : ""}`);
        }}
      >
        <div className="grupo-campos">
          <section className="panel">
            <h2>Datos de la pieza</h2>
            {avisos}
            <CamposProducto datos={datos} onCambio={setDatos} />
          </section>
          <section className="panel" aria-labelledby="t-fotos">
            <h2 id="t-fotos">Fotos</h2>
            <p className="campo-ayuda">
              La primera es la principal: la que se ve en el catálogo. Fotos verticales (4:5) se ven mejor. También puedes agregarlas después.
            </p>
            <SelectorFotos fotos={fotos} onCambio={setFotos} deshabilitado={enviando} />
          </section>
        </div>
        <aside className="panel">
          <h2>Precio</h2>
          <p className="campo-ayuda">
            Pesos colombianos con IVA incluido. Después de crearlo podrás agregar variantes (colores, tallas) e inventario.
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
          {paso ? (
            <p className="campo-ayuda" role="status">
              {paso}
            </p>
          ) : null}
        </aside>
      </form>
    </>
  );
}

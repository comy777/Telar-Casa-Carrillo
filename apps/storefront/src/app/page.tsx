import Image from "next/image";
import Link from "next/link";
import { EstadoVacio, claseBoton, formatoPesos } from "@telar/ui";
import { getArtisans, getCategories, getProducts } from "@/lib/catalog";
import { getBanners, getStoreSettings, getTestimonials } from "@/lib/content";
import { PilaPuesto } from "@/features/catalog/pila-puesto";
import { ListaPiezas } from "@/features/catalog/tarjeta-pieza";
import { Boletin } from "@/features/content/boletin";
import { Markdown } from "@/components/markdown";

export const revalidate = 60;

export default async function Inicio() {
  const [destacadas, nuevas, masVendidas, categorias, artesanos, banners, ajustes, testimonios] = await Promise.all([
    getProducts({ featured: true, inStock: true, sort: "newest", pageSize: 6 }),
    getProducts({ sort: "newest", pageSize: 8 }),
    getProducts({ sort: "best_selling", inStock: true, pageSize: 8 }),
    getCategories(),
    getArtisans({ pageSize: 6 }),
    getBanners(),
    getStoreSettings(),
    getTestimonials(),
  ]);

  // La pila: primero las destacadas, luego las nuevas disponibles, sin repetir.
  const vistos = new Set<string>();
  const pila = [...destacadas.items, ...nuevas.items.filter((p) => p.availability !== "OUT_OF_STOCK")]
    .filter((p) => (vistos.has(p.id) ? false : (vistos.add(p.id), true)))
    .slice(0, 6);
  const recientes = nuevas.items.filter((p) => !pila.slice(0, 1).some((x) => x.id === p.id)).slice(0, 4);
  const familia = artesanos.items.filter((a) => a.isFeatured).slice(0, 3);
  const banner = banners[0];
  const s = ajustes.settings;

  if (pila.length === 0 && categorias.length === 0) {
    return (
      <main className="envoltura">
        <EstadoVacio titulo="La tienda está preparando sus piezas">
          <p>Pronto verás aquí lo que sale del telar.</p>
        </EstadoVacio>
      </main>
    );
  }

  return (
    <main>
      {s?.announcement ? <p className="aviso-tienda">{s.announcement}</p> : null}

      {pila.length > 0 ? <PilaPuesto piezas={pila} /> : null}

      {banner ? (
        <section className="seccion letrero-banner" aria-labelledby="t-banner">
          <div className="envoltura">
            <div className="letrero-banner-foto foto-real">
              <Image src={banner.imageUrl} alt={banner.imageAlt ?? ""} fill sizes="(max-width: 900px) 100vw, 60vw" />
            </div>
            <div className="tabla">
              <h2 id="t-banner">{banner.title}</h2>
              {banner.subtitle ? <p>{banner.subtitle}</p> : null}
              {banner.targetUrl && banner.ctaLabel ? (
                <Link className={claseBoton("claro")} href={banner.targetUrl}>
                  {banner.ctaLabel}
                </Link>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {categorias.length > 0 ? (
        <section className="seccion" aria-labelledby="t-categorias">
          <div className="envoltura">
            <h2 className="titulo" id="t-categorias">
              Lo que sale del telar
            </h2>
            <div className="letreros">
              {categorias.slice(0, 3).map((c) => (
                <Link key={c.id} className="letrero-cat" href={`/categorias/${c.slug}`}>
                  {c.imageUrl ? (
                    <Image className="foto-cat" src={c.imageUrl} alt="" fill sizes="(max-width: 760px) 100vw, 33vw" />
                  ) : null}
                  <span className="placa">
                    <strong>{c.name}</strong>
                    {c.description ? <span>{c.description}</span> : null}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {recientes.length > 0 ? (
        <section className="seccion" aria-labelledby="t-nuevas">
          <div className="envoltura">
            <div className="cabecera">
              <h2 className="titulo" id="t-nuevas">
                Recién bajadas del telar
              </h2>
              <Link href="/productos">Ver todas las piezas</Link>
            </div>
            <ListaPiezas piezas={recientes} />
          </div>
        </section>
      ) : null}

      {familia.length > 0 ? (
        <section className="seccion familia" id="familia" aria-labelledby="t-familia">
          <div className="envoltura">
            <div className="cabecera">
              <h2 className="titulo" id="t-familia">
                Quién teje cada pieza
              </h2>
              <Link href="/artesanos">Conoce a la familia</Link>
            </div>
            <ul className="tejedores">
              {familia.map((a) => (
                <li key={a.id} className="tejedor-ficha">
                  <Link href={`/artesanos/${a.slug}`}>
                    <div className="retrato foto-real">
                      {a.photoUrl ? <Image src={a.photoUrl} alt={a.name} fill sizes="(max-width: 760px) 50vw, 33vw" /> : null}
                    </div>
                    <h3>{a.name}</h3>
                    {a.biography ? <p>{a.biography}</p> : null}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {s?.storyTitle && s.storyBody ? (
        <section className="seccion historia" id="historia" aria-labelledby="t-historia">
          <div className="envoltura">
            <div className="taller" aria-hidden="true" />
            <div className="texto">
              <h2 className="titulo" id="t-historia">
                {s.storyTitle}
              </h2>
              <Markdown texto={s.storyBody} className="prosa historia-texto" />
              <p>
                <Link className={claseBoton("borde")} href="/artesanos">
                  Conoce a la familia
                </Link>
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {masVendidas.items.length > 0 ? (
        <section className="seccion lista-precios" aria-labelledby="t-precios">
          <div className="envoltura">
            <div className="tablero">
              <h2 className="titulo" id="t-precios">
                Las que más se llevan
              </h2>
              <ul className="precios">
                {masVendidas.items.map((p) => (
                  <li key={p.id} className={p.availability === "OUT_OF_STOCK" ? "agotada" : undefined}>
                    <Link href={`/productos/${p.slug}`}>
                      <span className="muestra-lana foto-real">
                        {p.image ? <Image src={p.image.url} alt="" width={28} height={18} /> : null}
                      </span>
                      {p.name}
                    </Link>
                    <span className="relleno" aria-hidden="true" />
                    <span className="valor">
                      {p.availability === "OUT_OF_STOCK" ? "Agotada" : formatoPesos(p.price)}
                    </span>
                  </li>
                ))}
              </ul>
              <Link className={claseBoton("claro")} href="/productos?orden=best_selling">
                Ver todas las piezas
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {testimonios.length > 0 ? (
        <section className="seccion" aria-labelledby="t-testimonios">
          <div className="envoltura">
            <h2 className="titulo" id="t-testimonios">
              Lo que dicen quienes ya compraron
            </h2>
            <ul className="testimonios">
              {testimonios.slice(0, 3).map((t) => (
                <li key={t.id}>
                  <blockquote>
                    <p>{t.content}</p>
                  </blockquote>
                  <p className="firma">
                    {t.customerName}
                    {t.location ? `, ${t.location}` : ""}
                    {t.rating ? <span className="sr"> · {t.rating} de 5</span> : null}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <Boletin />
    </main>
  );
}

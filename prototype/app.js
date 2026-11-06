// Prototipo: datos de ejemplo. En la app real todo viene de la API (/catalog/*).
const PIEZAS = [
  { slug: "ruana-gris-oveja", tipo: "ruana", categoria: "Ruanas", nombre: "Ruana de lana virgen gris oveja", precio: 289000, antes: null, quedan: 3, lana: "#a39e95", letra: "#1a1a17" },
  { slug: "ruana-nogal", tipo: "ruana", categoria: "Ruanas", nombre: "Ruana teñida con nogal", precio: 319000, antes: 349000, quedan: 8, lana: "#5b4232" },
  { slug: "hamaca-crudo-verde", tipo: "hamaca", categoria: "Hamacas", nombre: "Hamaca doble en algodón crudo", precio: 420000, antes: null, quedan: 2, lana: "#d9d2c3", lana2: "#1e5a3c", letra: "#1a1a17" },
  { slug: "ruana-negro-natural", tipo: "ruana", categoria: "Ruanas", nombre: "Ruana de lana negra natural", precio: 299000, antes: null, quedan: 12, lana: "#262220" },
  { slug: "chal-pardo", tipo: "ruana", categoria: "Prendas", nombre: "Chal de lana parda", precio: 168000, antes: null, quedan: 5, lana: "#8a7560" },
  { slug: "hamaca-nogal-crudo", tipo: "hamaca", categoria: "Hamacas", nombre: "Hamaca sencilla nogal y crudo", precio: 310000, antes: null, quedan: 0, lana: "#5b4232", lana2: "#d9d2c3" },
  { slug: "poncho-gris-claro", tipo: "ruana", categoria: "Prendas", nombre: "Poncho corto gris claro", precio: 214000, antes: 239000, quedan: 6, lana: "#c4c0b8", letra: "#1a1a17" },
  { slug: "ruana-crudo", tipo: "ruana", categoria: "Ruanas", nombre: "Ruana color crudo con flecos largos", precio: 305000, antes: null, quedan: 4, lana: "#d9d2c3", letra: "#1a1a17" },
];

const pesos = (n) => "$ " + n.toLocaleString("es-CO");

const ICONOS = {
  bolsa: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" aria-hidden="true"><path d="M5 8h14l-1 13H6L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" aria-hidden="true"><path d="M3 7h18M3 12h18M3 17h18"/></svg>',
  lupa: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" aria-hidden="true"><circle cx="11" cy="11" r="6"/><path d="m20 20-4.5-4.5"/></svg>',
};

function encabezado(actual) {
  const enlace = (href, texto) =>
    `<a href="${href}"${actual === href ? ' aria-current="page"' : ""}>${texto}</a>`;
  return `
  <header class="letrero-nav">
    <div class="envoltura">
      <a class="marca" href="index.html">Telar Casa Carrillo</a>
      <nav id="menu" aria-label="Principal">
        ${enlace("catalogo.html", "Ruanas")}
        ${enlace("catalogo.html#prendas", "Prendas")}
        ${enlace("catalogo.html#hamacas", "Hamacas")}
        ${enlace("index.html#familia", "La familia")}
        ${enlace("index.html#historia", "El taller")}
      </nav>
      <a class="carrito" href="#" aria-label="Carrito, 0 piezas">${ICONOS.bolsa}<span class="texto">Carrito</span> 0</a>
      <button class="menu-boton" aria-expanded="false" aria-controls="menu" aria-label="Abrir menú">${ICONOS.menu}</button>
    </div>
  </header>`;
}

function pie() {
  return `
  <div class="zocalo" aria-hidden="true"></div>
  <footer class="pie">
    <div class="envoltura">
      <div class="columnas">
        <div>
          <a class="marca" href="index.html">Telar Casa Carrillo</a>
          <p>Ruanas, prendas y hamacas tejidas en telar por la familia Carrillo.</p>
          <p><span class="marcador">[Ciudad, departamento]</span></p>
        </div>
        <div><h3>Tienda</h3><ul><li><a href="catalogo.html">Ruanas</a></li><li><a href="catalogo.html">Prendas</a></li><li><a href="catalogo.html">Hamacas</a></li></ul></div>
        <div><h3>Ayuda</h3><ul><li><a href="#">Seguir mi pedido</a></li><li><a href="#">Envíos</a></li><li><a href="#">Cambios y devoluciones</a></li><li><a href="#">Preguntas frecuentes</a></li><li><a href="#">Contacto</a></li></ul></div>
        <div><h3>Legal</h3><ul><li><a href="#">Términos y condiciones</a></li><li><a href="#">Tratamiento de datos</a></li><li><a href="#">Derecho de retracto</a></li><li><a href="#">Garantías</a></li></ul></div>
      </div>
      <div class="legal"><span>© Telar Casa Carrillo</span><span>Precios en pesos colombianos con IVA incluido</span></div>
    </div>
  </footer>
  <p class="aviso-prototipo">Prototipo · datos y fotos de ejemplo</p>`;
}

function tarjeta(p) {
  const agotada = p.quedan === 0;
  return `
  <li class="pieza${agotada ? " agotada" : ""}">
    <a href="producto.html">
      <div class="foto-pieza" style="--lana:${p.lana}"><span>[Foto real: ${p.nombre.toLowerCase()}]</span></div>
      <div class="etiqueta"><strong>${pesos(p.precio)}</strong>${p.antes ? `<s>${pesos(p.antes)}</s>` : ""}</div>
      <h3>${p.nombre}</h3>
      <p>${agotada ? "Agotada" : p.quedan <= 3 ? `Quedan ${p.quedan}` : "Disponible"} · Tejida por <span class="marcador">[nombre]</span></p>
    </a>
  </li>`;
}

function montarComun() {
  const actual = document.body.dataset.pagina;
  document.querySelector("[data-encabezado]")?.insertAdjacentHTML("afterbegin", encabezado(actual));
  document.querySelector("[data-pie]")?.insertAdjacentHTML("afterbegin", pie());
  const boton = document.querySelector(".menu-boton");
  const menu = document.getElementById("menu");
  boton?.addEventListener("click", () => {
    const abierto = menu.classList.toggle("abierto");
    boton.setAttribute("aria-expanded", String(abierto));
    boton.setAttribute("aria-label", abierto ? "Cerrar menú" : "Abrir menú");
  });
  document.querySelectorAll("[data-piezas]").forEach((ul) => {
    const filtro = ul.dataset.piezas;
    const lista = filtro === "todas"
      ? PIEZAS
      : PIEZAS.filter((p) => p.categoria === filtro).concat(PIEZAS.filter((p) => p.categoria !== filtro));
    ul.innerHTML = lista.slice(0, Number(ul.dataset.max || lista.length)).map(tarjeta).join("");
  });
}

// La pila del puesto: tocar una banda la despliega y la tabla muestra esa pieza.
function montarPila() {
  const pila = document.querySelector(".pila");
  const tabla = document.querySelector(".tabla");
  if (!pila || !tabla) return;
  const visibles = PIEZAS.filter((p) => p.quedan > 0).slice(0, 6);
  pila.innerHTML = visibles
    .map(
      (p, i) => `
    <li><button class="banda ${p.tipo}" aria-pressed="${i === 0}" data-i="${i}"
      style="--lana:${p.lana};--lana-2:${p.lana2 || p.lana};${p.letra ? `--letra:${p.letra}` : ""}">
      <span class="foto">[Foto real: ${p.nombre.toLowerCase()}]</span>
      <span class="rotulo">${p.nombre}<small>${p.categoria} · ${pesos(p.precio)}</small></span>
    </button></li>`
    )
    .join("");

  const pintar = (p) => {
    tabla.querySelector("h1").textContent = p.nombre;
    tabla.querySelector(".precio-pintado").innerHTML =
      pesos(p.precio) + (p.antes ? `<span class="antes">${pesos(p.antes)}</span>` : "");
    const ex = tabla.querySelector(".existencias");
    ex.textContent = p.quedan <= 3 ? `Quedan ${p.quedan}` : "Disponible";
    ex.classList.toggle("pocas", p.quedan <= 3);
  };

  const elegir = (banda) => {
    if (!banda || banda.getAttribute("aria-pressed") === "true") return;
    pila.querySelectorAll(".banda").forEach((b) => b.setAttribute("aria-pressed", String(b === banda)));
    pintar(visibles[Number(banda.dataset.i)]);
  };
  pila.addEventListener("click", (e) => elegir(e.target.closest(".banda")));
  // Con mouse, pasar sobre una banda también la elige (con una pausa corta de intención).
  if (matchMedia("(hover: hover)").matches) {
    let espera;
    pila.addEventListener("pointerover", (e) => {
      const banda = e.target.closest(".banda");
      clearTimeout(espera);
      if (banda) espera = setTimeout(() => elegir(banda), 120);
    });
    pila.addEventListener("pointerleave", () => clearTimeout(espera));
  }
  pintar(visibles[0]);
}

function montarPrecios() {
  const ul = document.querySelector("[data-precios]");
  if (!ul) return;
  ul.innerHTML = PIEZAS.map(
    (p) => `
    <li${p.quedan === 0 ? ' class="agotada"' : ""}>
      <a href="producto.html"><span class="muestra-lana" style="--lana:${p.lana}"></span>${p.nombre}</a>
      <span class="relleno" aria-hidden="true"></span>
      <span class="valor">${p.quedan === 0 ? "Agotada" : pesos(p.precio)}</span>
    </li>`
  ).join("");
}

function montarFicha() {
  const cantidad = document.querySelector(".cantidad output");
  if (!cantidad) return;
  const max = 3;
  document.querySelectorAll(".cantidad button").forEach((b) =>
    b.addEventListener("click", () => {
      const n = Math.min(max, Math.max(1, Number(cantidad.value) + Number(b.dataset.paso)));
      cantidad.value = n;
    })
  );
  document.querySelectorAll(".miniaturas button").forEach((b) =>
    b.addEventListener("click", () => {
      document.querySelectorAll(".miniaturas button").forEach((o) => o.setAttribute("aria-current", String(o === b)));
      document.querySelector(".galeria .principal").style.setProperty("--lana", b.style.getPropertyValue("--lana"));
    })
  );
}

function montarCatalogo() {
  const boton = document.querySelector(".filtros-movil");
  const filtros = document.querySelector(".filtros");
  boton?.addEventListener("click", () => {
    const abierto = filtros.classList.toggle("abierto");
    boton.setAttribute("aria-expanded", String(abierto));
  });
}

montarComun();
montarPila();
montarPrecios();
montarFicha();
montarCatalogo();

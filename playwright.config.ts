import { defineConfig, devices } from "@playwright/test";

/**
 * E2E contra la tienda y el panel corriendo en local con la API y los datos de demostración
 * (npm run db:seed:demo en el backend). En CI, TIENDA_URL/ADMIN_URL apuntan al entorno de pruebas.
 */
const TIENDA = process.env.TIENDA_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: TIENDA,
    locale: "es-CO",
    timezoneId: "America/Bogota",
    trace: "retain-on-failure",
    // Sin descargar navegadores: usa Edge o Chrome instalados (PW_CHANNEL=chrome para Chrome).
    channel: process.env.PW_CHANNEL ?? "msedge",
  },
  projects: [
    { name: "escritorio", use: { ...devices["Desktop Edge"], viewport: { width: 1440, height: 900 } } },
    { name: "celular", use: { ...devices["Pixel 7"], channel: process.env.PW_CHANNEL ?? "msedge" } },
  ],
});

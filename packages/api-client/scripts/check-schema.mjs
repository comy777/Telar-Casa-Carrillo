// Verifica que src/schema.d.ts coincide con el OpenAPI publicado por el backend.
// Uso en CI: API_DOCS_URL=https://api.../api/docs-json npm run api:check
import { execFileSync } from "node:child_process";
import { readFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const url = process.env.API_DOCS_URL ?? "http://localhost:3001/api/docs-json";
const dir = mkdtempSync(join(tmpdir(), "telar-schema-"));
const out = join(dir, "schema.d.ts");
execFileSync("npx", ["openapi-typescript", url, "-o", out], { stdio: "inherit", shell: true });

const normalize = (s) => s.replace(/\r\n/g, "\n").trim();
const actual = normalize(readFileSync(new URL("../src/schema.d.ts", import.meta.url), "utf8"));
const expected = normalize(readFileSync(out, "utf8"));
if (actual !== expected) {
  console.error("src/schema.d.ts está desactualizado. Ejecuta: npm run api:generate");
  process.exit(1);
}
console.log("El contrato de la API está al día.");

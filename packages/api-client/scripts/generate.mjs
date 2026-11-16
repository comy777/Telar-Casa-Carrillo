// Genera src/schema.d.ts desde el OpenAPI del backend (funciona igual en Windows y Unix).
// Uso: API_DOCS_URL=https://api.../api/docs-json npm run api:generate
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const url = process.env.API_DOCS_URL ?? "http://localhost:3001/api/docs-json";
const out = fileURLToPath(new URL("../src/schema.d.ts", import.meta.url));
execFileSync("npx", ["openapi-typescript", url, "-o", `"${out}"`], { stdio: "inherit", shell: true });

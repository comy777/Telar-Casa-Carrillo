// ESLint para todo el repositorio: reglas de Next en las apps y límites entre capas.
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const capas = {
  // packages/ui es presentación pura: no conoce la API ni las apps.
  files: ["packages/ui/**/*.{ts,tsx}"],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          { group: ["@telar/api-client", "@telar/api-client/*"], message: "packages/ui no debe depender de la API." },
          { group: ["next/*", "next"], message: "packages/ui no debe depender de Next." },
        ],
      },
    ],
  },
};

const apps = {
  files: ["apps/**/*.{ts,tsx}"],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          { group: ["../../packages/*", "../../../packages/*"], message: "Importa los paquetes por su nombre (@telar/...)." },
        ],
      },
    ],
    // Las fotos vienen de Cloudinary con next/image; <img> solo para casos justificados.
    "@next/next/no-img-element": "error",
  },
};

const config = [
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "prototype/**",
      ".impeccable/**",
      ".claude/**",
      "packages/api-client/src/schema.d.ts",
      "**/next-env.d.ts",
      "playwright-report/**",
      "test-results/**",
    ],
  },
  ...nextVitals,
  ...nextTs,
  {
    settings: { next: { rootDir: ["apps/storefront", "apps/admin"] } },
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
  capas,
  apps,
];

export default config;

"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense, useState, type ReactNode } from "react";
import { isApiError } from "@telar/api-client";
import { SesionAdmin } from "@/lib/sesion";
import { Marco } from "@/components/marco";

export function Proveedores({ children }: { children: ReactNode }) {
  const [qc] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 15_000,
            refetchOnWindowFocus: false,
            retry: (n, e) => !(isApiError(e) && e.status >= 400 && e.status < 500) && n < 2,
          },
        },
      }),
  );
  return (
    <QueryClientProvider client={qc}>
      <SesionAdmin>
        <Marco>
          <Suspense>{children}</Suspense>
        </Marco>
      </SesionAdmin>
    </QueryClientProvider>
  );
}

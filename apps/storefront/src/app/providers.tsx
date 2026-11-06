"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { isApiError } from "@telar/api-client";
import { SesionProvider } from "@/features/auth/session-context";
import { CarritoProvider } from "@/features/cart/cart-context";

export function Providers({ children }: { children: ReactNode }) {
  const [qc] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: (n, e) => !(isApiError(e) && e.status >= 400 && e.status < 500) && n < 2,
          },
        },
      }),
  );
  return (
    <QueryClientProvider client={qc}>
      <SesionProvider>
        <CarritoProvider>{children}</CarritoProvider>
      </SesionProvider>
    </QueryClientProvider>
  );
}

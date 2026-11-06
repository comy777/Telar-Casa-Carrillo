export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
export const STOREFRONT_URL = (process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:3000").replace(/\/$/, "");

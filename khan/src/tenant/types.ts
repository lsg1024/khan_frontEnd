// src/tenant/types.ts
import { createContext } from "react";

export type TenantContextValue = { tenant: string };

export const TenantContext = createContext<TenantContextValue | null>(null);
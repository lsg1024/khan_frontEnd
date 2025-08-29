import React, { useMemo } from "react";
import { extractSubdomain } from "../../libs/domain";
import { TenantContext, type TenantContextValue } from "./TenantContext";

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const tenant = useMemo(
    () =>
        (typeof window !== "undefined"
        ? extractSubdomain(window.location.hostname)
        : null) || "default",
    []
    );

    const value: TenantContextValue = { tenant };

    return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
};

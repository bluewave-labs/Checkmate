export const SsoProviders = ["entra", "google"] as const;
export type SsoProvider = (typeof SsoProviders)[number];

export const SsoRoles = ["user", "admin"] as const;
export type SsoRole = (typeof SsoRoles)[number];

export const SsoCheckStatuses = ["allowed", "denied", "unknown"] as const;
export type SsoCheckStatus = (typeof SsoCheckStatuses)[number];

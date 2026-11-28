export const SsoProviders = ["entra", "google"] as const;
export type SsoProvider = (typeof SsoProviders)[number];

export const SsoRoles = ["user", "admin"] as const;
export type SsoRole = (typeof SsoRoles)[number];

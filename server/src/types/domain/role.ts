export const ScopeTypes = ["organization", "team"] as const;
export type ScopeType = (typeof ScopeTypes)[number];

export interface Role {
  id: string;
  organizationId: string;
  name: string;
  scope: ScopeType;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

import { Team, Role } from "@/types/domain/index.js";
import type { Entitlements } from "@/types/entitlements.js";
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TokenizedUser {
  sub: string;
  email: string;
  orgId: string;
}
export interface UserContext {
  sub: string;
  email: string;
  orgId: string;
  teamIds?: string[];
  teams?: Team[];
  currentTeamId?: string;
  roles?: {
    orgRole?: Role;
    teamRole: Role;
  };
  entitlements: Entitlements;
}

export interface UserReturnable {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  org: {
    name: string;
    planKey: string;
    permissions: string[];
  };
  teams: {
    id: string;
    name: string;
    permissions: string[];
  }[];
  entitlements: Entitlements;
}

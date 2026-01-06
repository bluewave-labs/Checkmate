export interface Invite {
  id: string;
  orgId: string;
  orgRoleId?: string;
  teamId: string;
  teamRoleId: string;
  email: string;
  tokenHash: string;
  createdBy: string;
  updatedBy: string;
  expiry: string;
  createdAt: string;
  updatedAt: string;
}

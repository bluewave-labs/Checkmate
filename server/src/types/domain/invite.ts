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
  expiry: Date;
  createdAt: Date;
  updatedAt: Date;
}

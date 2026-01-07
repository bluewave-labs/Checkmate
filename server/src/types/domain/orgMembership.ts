export interface OrgMembership {
  id: string;
  orgId: string;
  userId: string;
  roleId?: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

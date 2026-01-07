export interface TeamMembership {
  id: string;
  orgId: string;
  teamId: string;
  userId: string;
  roleId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamMembershipWithDetails extends TeamMembership {
  role: {
    id: string;
    organizationId: string;
    name: string;
    permissions: string[];
    createdAt: Date;
    updatedAt: Date;
  };
}

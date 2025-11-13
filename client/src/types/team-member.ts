export interface ITeamMember {
  _id: string;
  orgId: string;
  teamId: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  roleId: {
    _id: string;
    name: string;
    scope: string;
    permissions: string[];
  };
}

import type { Entitlements } from "./entitlements";

export interface IUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  org: {
    name: string;
    permissions: string[];
  };
  teams: {
    id: string;
    name: string;
    permissions: string;
  }[];
  entitlements: Entitlements;
}
export interface IMongoUser {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
}

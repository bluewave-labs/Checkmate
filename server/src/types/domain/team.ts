export interface Team {
  id: string;
  orgId: string;
  name: string;
  description?: string;
  isSystem?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

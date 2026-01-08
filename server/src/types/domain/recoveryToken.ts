export interface RecoveryToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiry: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Team {
	id: string;
	email: string;
	createdAt: string;
	updatedAt: string;
	heartbeatKeyHash?: string;
	heartbeatKeyCreatedBy?: string;
}

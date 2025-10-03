export interface Check {
	_id: string;
	status: string;
	responseTime: number;
	createdAt: string;
}

export interface GroupedCheck {
	_id: string;
	avgResponseTime: number;
	count: number;
}

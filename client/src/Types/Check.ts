export interface CheckTimingPhases {
	wait: number;
	dns: number;
	tcp: number;
	tls: number;
	request: number;
	firstByte: number;
	download: number;
	total: number;
}

export interface CheckTimings {
	start: string;
	socket: string;
	lookup: string;
	connect: string;
	secureConnect: string;
	response: string;
	end: string;
	phases: CheckTimingPhases;
}

export interface Check {
	_id: string;
	monitorId: string;
	type: string;
	status: string;
	message: string;
	responseTime: number;
	normalResponseTime?: number;
	httpStatusCode: number;
	ack: boolean;
	expiry: string;
	createdAt: string;
	updatedAt: string;
	timings: CheckTimings;
}

export interface GroupedCheck {
	_id: string;
	avgResponseTime: number;
	count: number;
}

export interface LatestCheck {
	status: string;
	responseTime: number;
	checkedAt: string;
	_id: string;
}

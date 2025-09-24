class ApiError extends Error {
	public status: number;

	constructor(message: string, status: number = 500) {
		super(message);
		this.status = status;
		this.name = this.constructor.name;

		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, this.constructor);
		}
	}
}

export default ApiError;

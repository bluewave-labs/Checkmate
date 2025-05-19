const SERVICE_NAME = "RedisService";

class RedisService {
	static SERVICE_NAME = SERVICE_NAME;
	constructor({ Redis, logger }) {
		this.Redis = Redis;
		this.connections = new Set();
		this.logger = logger;
	}

	getNewConnection(options = {}) {
		const connection = new this.Redis(process.env.REDIS_URL, {
			retryStrategy: (times) => {
				return null;
			},
			...options,
		});
		this.connections.add(connection);
		return connection;
	}

	async closeAllConnections() {
		const closePromises = Array.from(this.connections).map((conn) =>
			conn.quit().catch((err) => {
				this.logger.error({
					message: "Error closing Redis connection",
					service: SERVICE_NAME,
					method: "closeAllConnections",
					details: { error: err },
				});
			})
		);

		await Promise.all(closePromises);
		this.connections.clear();
		this.logger.info({
			message: "All Redis connections closed",
			service: SERVICE_NAME,
			method: "closeAllConnections",
		});
	}

	async flushRedis() {
		this.logger.info({
			message: "Flushing Redis",
			service: SERVICE_NAME,
			method: "flushRedis",
		});
		const flushPromises = Array.from(this.connections).map((conn) => conn.flushall());
		await Promise.all(flushPromises);
		this.logger.info({
			message: "Redis flushed",
			service: SERVICE_NAME,
			method: "flushRedis",
		});
	}
}

export default RedisService;

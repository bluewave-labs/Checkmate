class RedisService {
	static SERVICE_NAME = "RedisService";

	constructor({ logger, IORedis, SettingsService }) {
		this.logger = logger;
		this.IORedis = IORedis;
		this.SettingsService = SettingsService;
		this.connection = null;
	}

	static async createInstance({ logger, IORedis, SettingsService }) {
		const instance = new RedisService({ logger, IORedis, SettingsService });
		await instance.connect();
		return instance;
	}

	async connect() {
		const settings = this.SettingsService.getSettings();
		const { redisUrl } = settings;
		this.connection = new this.IORedis(redisUrl, {
			maxRetriesPerRequest: null,
			retryStrategy: (times) => {
				if (times >= 5) {
					throw new Error("Failed to connect to Redis");
				}
				this.logger.debug({
					message: "Retrying Redis connection",
					service: RedisService.SERVICE_NAME,
					details: { times },
				});
				return Math.min(times * 100, 2000);
			},
		});

		await new Promise((resolve, reject) => {
			let errorOccurred = false;

			this.connection.on("ready", () => {
				if (!errorOccurred) {
					this.logger.info({
						message: "Redis connection established",
						service: RedisService.SERVICE_NAME,
					});
					resolve();
				}
			});

			this.connection.on("error", (err) => {
				errorOccurred = true;
				this.logger.error({
					message: "Redis connection error",
					service: RedisService.SERVICE_NAME,
					error: err,
				});
				setTimeout(() => reject(err), 5000);
			});
		});
	}
	async flushall() {
		this.logger.debug({
			message: "Flushing all Redis data",
			service: RedisService.SERVICE_NAME,
		});
		await this.connection.flushall();
	}

	getConnection() {
		return this.connection;
	}
}

export default RedisService;

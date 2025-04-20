const SERVICE_NAME = "ServiceRegistry";
import logger from "../utils/logger.js";
class ServiceRegistry {
	static SERVICE_NAME = SERVICE_NAME;
	constructor() {
		this.services = {};
	}

	register(name, service) {
		logger.info({
			message: `Registering service ${name}`,
			service: SERVICE_NAME,
			method: "register",
		});
		this.services[name] = service;
	}

	get(name) {
		if (!this.services[name]) {
			logger.error({
				message: `Service ${name} is not registered`,
				service: SERVICE_NAME,
				method: "get",
			});
			throw new Error(`Service ${name} is not registered`);
		}
		return this.services[name];
	}

	listServices() {
		return Object.keys(this.services);
	}
}

export default new ServiceRegistry();

const SERVICE_NAME = "ServiceRegistry";

class ServiceRegistry {
	static SERVICE_NAME = SERVICE_NAME;

	constructor({ logger }) {
		this.services = {};
		this.logger = logger;
	}

	get serviceName() {
		return ServiceRegistry.SERVICE_NAME;
	}

	// Instance methods
	register(name, service) {
		this.logger.info({
			message: `Registering service ${name}`,
			service: SERVICE_NAME,
			method: "register",
		});
		this.services[name] = service;
	}

	get(name) {
		if (!this.services[name]) {
			this.logger.error({
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

	static get(name) {
		if (!ServiceRegistry.instance) {
			throw new Error("ServiceRegistry not initialized");
		}
		return ServiceRegistry.instance.get(name);
	}

	static register(name, service) {
		if (!ServiceRegistry.instance) {
			throw new Error("ServiceRegistry not initialized");
		}
		return ServiceRegistry.instance.register(name, service);
	}

	static listServices() {
		if (!ServiceRegistry.instance) {
			throw new Error("ServiceRegistry not initialized");
		}
		return ServiceRegistry.instance.listServices();
	}
}

export default ServiceRegistry;

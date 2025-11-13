const SERVICE_NAME = "ServiceRegistry";

export interface IServiceRegistry {
  register: (name: string, service: any) => void;
  get: (name: string) => any;
  listServices: () => string[];
}

class ServiceRegistry implements IServiceRegistry {
  public SERVICE_NAME: string;
  private static _instance: ServiceRegistry;

  private services: { [key: string]: any };

  private constructor() {
    this.SERVICE_NAME = SERVICE_NAME;
    this.services = {};
  }

  static get instance(): ServiceRegistry {
    if (!this._instance) {
      this._instance = new ServiceRegistry();
    }
    return this._instance;
  }

  get serviceName() {
    return this.SERVICE_NAME;
  }

  // Instance methods
  register(name: string, service: any) {
    this.services[name] = service;
  }

  get(name: string) {
    if (!this.services[name]) {
      throw new Error(`Service ${name} is not registered`);
    }
    return this.services[name];
  }

  listServices() {
    return Object.keys(this.services);
  }

  static get(name: string) {
    if (!ServiceRegistry.instance) {
      throw new Error("ServiceRegistry not initialized");
    }
    return ServiceRegistry.instance.get(name);
  }

  static register(name: string, service: any) {
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

import Transport from "winston-transport";

interface MemoryCacheTransportOptions extends Transport.TransportStreamOptions {
  maxItems?: number;
}

export default class MemoryTransport extends Transport {
  private logs: any[] = [];
  private maxItems: number;

  constructor(opts?: MemoryCacheTransportOptions) {
    super(opts);
    this.maxItems = opts?.maxItems || 500;
  }

  log = (info: any, callback: () => void) => {
    setImmediate(() => this.emit("logged", info));
    this.logs.unshift(info);
    if (this.logs.length > this.maxItems) {
      this.logs.shift();
    }
    callback();
  };

  getLogs = (limit?: number) => {
    if (!limit) return this.logs;
    return this.logs.slice(-limit);
  };

  clear() {
    this.logs = [];
  }
}

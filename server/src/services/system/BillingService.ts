import { Plans, type Entitlements, type PlanKey } from "@/types/entitlements.js";

export interface IBillingService {
  listPlans(): Promise<Entitlements[]>;
}

const SERVICE_NAME = "BillingService";

class BillingService implements IBillingService {
  public SERVICE_NAME: string;
  constructor() {
    this.SERVICE_NAME = SERVICE_NAME;
  }
  async listPlans(): Promise<Entitlements[]> {
    const order: PlanKey[] = ["free", "pro", "business", "enterprise"];
    return order.map((key) => Plans[key]);
  }
}

export default BillingService;

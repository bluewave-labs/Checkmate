import { useMemo } from "react";
import { useAppSelector } from "@/hooks/AppHooks";
import { config } from "@/config";

export type PlanEntitlementKey =
  | "monitorsMax"
  | "notificationChannelsMax"
  | "statusPagesMax"
  | "checksIntervalMsMin"
  | "teamsMax";

export function useLimitReached(
  entitlement: PlanEntitlementKey | null,
  currentCount: number
): boolean {
  const entitlements = useAppSelector((s: any) => s.auth?.user?.entitlements);

  return useMemo(() => {
    if (config.DEPLOYMENT_MODE === "self_hosted") return false;
    if (!entitlement) return false;
    const value = entitlements?.[entitlement];
    if (typeof value !== "number") return false;
    return currentCount >= value;
  }, [entitlement, currentCount, entitlements]);
}

export default useLimitReached;

import { BasePage, InfoBox, PlanCard } from "@/components/design-elements";
import Grid from "@mui/material/Grid";
import { useTheme } from "@mui/material/styles";

import { useAppSelector } from "@/hooks/AppHooks";
import { useGet, usePost } from "@/hooks/UseApi";
import type { ApiResponse } from "@/hooks/UseApi";
import type { Entitlements, PlanKey } from "@/types/entitlements";

const BillingPage = () => {
  const { user } = useAppSelector((state) => state.auth);
  const { response } = useGet<ApiResponse<Entitlements[]>>(
    "/billing/plans",
    {},
    {}
  );
  const { post, loading: isPosting } = usePost();
  const plans = response?.data ?? [];
  const theme = useTheme();
  const selectedPlan = user?.entitlements?.plan || null;

  const handlePlanClick = async (planKey: PlanKey) => {
    const result = await post("/billing/subscribe", { planKey });
    const redirectUrl = result?.data?.redirectUrl;
    if (redirectUrl) {
      window.location = redirectUrl;
    }
  };

  return (
    <BasePage>
      <InfoBox
        title="Choose a plan!"
        description="Choose a plan that fits your needs and start enjoying our services."
      />
      <Grid
        container
        spacing={theme.spacing(10)}
        columns={{ xs: 1, sm: 2, md: 4 }}
      >
        {plans.map((plan) => (
          <Grid key={plan.plan} size={1}>
            <PlanCard
              plan={plan}
              currentPlan={selectedPlan}
              onClick={handlePlanClick}
            />
          </Grid>
        ))}
      </Grid>
    </BasePage>
  );
};

export default BillingPage;

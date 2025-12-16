import { BasePage, InfoBox, PlanCard } from "@/components/design-elements";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import { Button } from "@/components/inputs";

import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "@/hooks/AppHooks";
import { useGet, usePost } from "@/hooks/UseApi";
import type { ApiResponse } from "@/types/api";
import type { Entitlements, PlanKey } from "@/types/entitlements";
import { useEffect } from "react";
import type { IUser } from "@/types/user";
import { setSelectedTeamId, setUser } from "@/features/authSlice";

const BillingPage = () => {
  const { t } = useTranslation();
  const { user } = useAppSelector((state) => state.auth);
  const { response } = useGet<ApiResponse<Entitlements[]>>(
    "/billing/plans",
    {},
    {}
  );
  const { response: meResponse } = useGet<ApiResponse<IUser>>(
    "/me",
    {},
    { refreshInterval: 10000 }
  );
  const { post, loading: isPosting } = usePost();
  const plans = response?.data ?? [];

  const selectedPlan = user?.entitlements?.plan || null;
  const dispatch = useAppDispatch();
  const selectedTeamId = useAppSelector((s) => s.auth.selectedTeamId);

  useEffect(() => {
    const freshUser = meResponse?.data;
    if (!freshUser) return;
    dispatch(setUser(freshUser));

    if (
      !selectedTeamId ||
      !freshUser.teams.find((t) => t.id === selectedTeamId)
    ) {
      dispatch(setSelectedTeamId(freshUser.teams[0].id));
    }
  }, [meResponse, dispatch, selectedTeamId]);

  const handlePlanClick = async (planKey: PlanKey) => {
    const result = await post("/billing/subscribe", { planKey });
    const redirectUrl = result?.data?.redirectUrl;
    if (redirectUrl) {
      window.location = redirectUrl;
    }
  };

  const handleCancel = async () => {
    const result = await post("/billing/cancel", {});
    const redirectUrl = result?.data?.redirectUrl;
    if (redirectUrl) {
      window.location = redirectUrl;
    }
  };

  return (
    <BasePage>
      <InfoBox
        title={t("billing.infoBox.title")}
        description={t("billing.infoBox.description")}
      />
      <Grid container spacing={10} columns={{ xs: 1, sm: 2, md: 4 }}>
        {plans.map((plan) => (
          <Grid key={plan.plan} size={1}>
            <PlanCard
              plan={plan}
              currentPlan={selectedPlan}
              onClick={handlePlanClick}
              loading={isPosting}
            />
          </Grid>
        ))}
      </Grid>
      {selectedPlan !== "free" && (
        <Box>
          <Button
            variant="contained"
            color="error"
            onClick={handleCancel}
            loading={isPosting}
          >
            {t("common.buttons.cancelSubscription")}
          </Button>
        </Box>
      )}
    </BasePage>
  );
};

export default BillingPage;

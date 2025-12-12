import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import { Button } from "@/components/inputs";
import { BaseBox } from "@/components/design-elements";
import {
  PersonStanding,
  BicepsFlexed,
  Building2,
  Briefcase,
  Check,
} from "lucide-react";
import Divider from "@mui/material/Divider";
import Tooltip from "@mui/material/Tooltip";

import { useTheme } from "@mui/material/styles";
import type { Entitlements, PlanKey } from "@/types/entitlements";
import { useTranslation } from "react-i18next";

export const PlanCard = ({
  plan,
  currentPlan,
  onClick,
  loading,
}: {
  plan: Entitlements;
  currentPlan: PlanKey | null;
  onClick?: (planKey: PlanKey) => void;
  loading?: boolean;
}) => {
  const { t } = useTranslation();
  const selected = plan.plan === currentPlan;
  const theme = useTheme();
  const checkColor =
    plan.plan === "enterprise"
      ? theme.palette.success.main
      : plan.plan === "free"
        ? theme.palette.text.secondary
        : theme.palette.primary.main;
  const Icon = (() => {
    switch (plan.plan) {
      case "free":
        return PersonStanding;
      case "pro":
        return BicepsFlexed;
      case "business":
        return Briefcase;
      case "enterprise":
        return Building2;
      default:
        return PersonStanding;
    }
  })();
  const priceLabel = (() => {
    if (typeof plan.price === "number") {
      const cents = plan.price;
      if (cents === 0) return "Free";
      const dollars = cents / 100;
      const formatted = dollars.toFixed(2);
      return `$${formatted}/mo`;
    }
  })();
  const featureItems = [
    {
      label: t("billing.plans.features.monitors.title"),
      value: plan.monitorsMax,
      tooltip: t("billing.plans.features.monitors.toolTip"),
    },
    {
      label: t("billing.plans.features.statusPages.title"),
      value: plan.statusPagesMax,
      tooltip: t("billing.plans.features.statusPages.toolTip"),
    },
    {
      label: t("billing.plans.features.notificationChannels.title"),
      value: plan.notificationChannelsMax,
      tooltip: t("billing.plans.features.notificationChannels.toolTip"),
    },
    {
      label: t("billing.plans.features.teams.title"),
      value: plan.teamsMax,
      tooltip: t("billing.plans.features.teams.toolTip"),
    },
    {
      label: t("billing.plans.features.retention.title"),
      value: `${plan.retentionDays} days`,
      tooltip: t("billing.plans.features.retention.toolTip"),
    },
    {
      label: t("billing.plans.features.interval.title"),
      value: `${Math.round(plan.checksIntervalMsMin / 1000)}s`,
      tooltip: t("billing.plans.features.interval.toolTip"),
    },
  ];
  return (
    <BaseBox
      padding={6}
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        border: selected ? 2 : 1,
        borderColor: selected ? theme.palette.primary.main : "divider",
        transition:
          "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
        ...(selected
          ? {}
          : {
              cursor: "pointer",
              "&:hover": {
                transform: "scale(0.995)",
                boxShadow: 2,
                borderColor: theme.palette.action.active,
              },
            }),
        position: "relative",
      }}
      onClick={selected ? undefined : () => onClick?.(plan.plan)}
    >
      <Stack spacing={3} sx={{ flexGrow: 1 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography variant="h6" textTransform="capitalize">
            {plan.plan}
          </Typography>
          <Stack direction="row" alignItems="center" spacing={1}>
            {plan.plan === "pro" && (
              <Chip
                size="small"
                label={t("billing.plans.mostPopular")}
                sx={{
                  bgcolor: theme.palette.primary.main,
                  color: theme.palette.getContrastText(
                    theme.palette.primary.main
                  ),
                }}
              />
            )}
            <Icon size={18} />
          </Stack>
        </Stack>
        <Divider />
        <Typography variant="h4" fontWeight={700}>
          {priceLabel}
        </Typography>
        <Stack spacing={2}>
          {featureItems.map((item) => (
            <Stack key={item.label} direction="row" alignItems="center" gap={2}>
              <Check size={16} color={checkColor} />
              {item.tooltip ? (
                <Tooltip title={item.tooltip} arrow placement="right">
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    fontSize={18}
                  >
                    {item.label}: {item.value}
                  </Typography>
                </Tooltip>
              ) : (
                <Typography
                  variant="body1"
                  color="text.secondary"
                  fontSize={18}
                >
                  {item.label}: {item.value}
                </Typography>
              )}
            </Stack>
          ))}
        </Stack>
      </Stack>
      <Stack direction="row" justifyContent="flex-end" pt={2}>
        {selected ? null : (
          // <Button variant="contained" color="accent" loading={loading}>
          //   Manage
          // </Button>
          <Button
            loading={loading}
            variant="contained"
            color="primary"
            onClick={(e) => {
              e.stopPropagation();
              onClick?.(plan.plan);
            }}
          >
            Choose plan
          </Button>
        )}
      </Stack>
    </BaseBox>
  );
};

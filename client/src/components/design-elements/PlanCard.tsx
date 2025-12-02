import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
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

export const PlanCard = ({
  plan,
  currentPlan,
  onClick,
}: {
  plan: Entitlements;
  currentPlan: PlanKey | null;
  onClick?: (planKey: PlanKey) => void;
}) => {
  const selected = plan.plan === currentPlan;
  const theme = useTheme();
  const checkColor =
    plan.plan === "enterprise"
      ? theme.palette.success.main
      : plan.plan === "free"
        ? theme.palette.text.secondary
        : theme.palette.accent.main;
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
      label: "Monitors",
      value: plan.monitorsMax,
      tooltip: "Maximum number of monitors allowed.",
    },
    {
      label: "Status pages",
      value: plan.statusPagesMax,
      tooltip: "Maximum public status pages you can create.",
    },
    {
      label: "Notification channels",
      value: plan.notificationChannelsMax,
      tooltip: "Maximum alerting channels (email, Slack, etc.).",
    },
    {
      label: "Teams",
      value: plan.teamsMax,
      tooltip: "Maximum number of teams in your org.",
    },
    {
      label: "Retention",
      value: `${plan.retentionDays} days`,
      tooltip: "Oldest checks are automatically removed after retention.",
    },
    {
      label: "Min interval",
      value: `${Math.round(plan.checksIntervalMsMin / 1000)}s`,
      tooltip: "Minimum check frequency allowed for this plan.",
    },
  ];
  return (
    <BaseBox
      padding={theme.spacing(8)}
      sx={
        selected
          ? {
              border: 2,
              borderColor: theme.palette.accent.main,
            }
          : { cursor: "pointer" }
      }
      onClick={selected ? undefined : () => onClick?.(plan.plan)}
    >
      <Stack spacing={theme.spacing(3)}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography variant="h6" textTransform="capitalize">
            {plan.plan}
          </Typography>
          <Icon size={18} />
        </Stack>
        <Divider />
        <Typography variant="h4" fontWeight={700}>
          {priceLabel}
        </Typography>
        <Stack spacing={theme.spacing(2)}>
          {featureItems.map((item) => (
            <Stack
              key={item.label}
              direction="row"
              alignItems="center"
              gap={theme.spacing(2)}
            >
              <Check size={16} color={checkColor} />
              {item.tooltip ? (
                <Tooltip title={item.tooltip} arrow placement="right">
                  <Typography variant="body1" color="text.secondary">
                    {item.label}: {item.value}
                  </Typography>
                </Tooltip>
              ) : (
                <Typography variant="body1" color="text.secondary">
                  {item.label}: {item.value}
                </Typography>
              )}
            </Stack>
          ))}
        </Stack>
      </Stack>
    </BaseBox>
  );
};

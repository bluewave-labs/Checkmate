import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { BaseBox } from "@/components/design-elements";

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
      <Stack spacing={theme.spacing(2)}>
        <Typography variant="h6" textTransform="capitalize">
          {plan.plan}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Monitors: {plan.monitorsMax}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Status pages: {plan.statusPagesMax}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Notification channels: {plan.notificationChannelsMax}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Teams: {plan.teamsMax}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Min interval: {Math.round(plan.checksIntervalMsMin / 1000)}s
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Retention: {plan.retentionDays} days
        </Typography>
      </Stack>
    </BaseBox>
  );
};

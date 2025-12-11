import Stack from "@mui/material/Stack";
import { Button } from "@/components/inputs";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import Tooltip from "@mui/material/Tooltip";
import {
  useLimitReached,
  type PlanEntitlementKey,
} from "@/hooks/UsePlanEntitlements";
export const HeaderCreate = ({
  label,
  isLoading,
  path,
  entitlement,
  entitlementCount,
}: {
  label?: string;
  isLoading: boolean;
  path: string;
  entitlement: PlanEntitlementKey | null;
  entitlementCount: number;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const limitReached = useLimitReached(entitlement, entitlementCount);

  return (
    <Stack
      direction="row"
      justifyContent="end"
      alignItems="center"
      gap={theme.spacing(6)}
    >
      <Tooltip
        title={limitReached ? "Upgrade your plan to create more teams" : ""}
        disableHoverListener={!limitReached}
      >
        <span>
          <Button
            loading={isLoading}
            variant="contained"
            color="primary"
            disabled={limitReached}
            onClick={() => navigate(path)}
          >
            {limitReached
              ? "Your plan's limit has been reached"
              : label || t("common.buttons.createNew")}
          </Button>
        </span>
      </Tooltip>
    </Stack>
  );
};

import Stack from "@mui/material/Stack";
import { Button } from "@/components/inputs";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import Tooltip from "@mui/material/Tooltip";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { useMemo } from "react";
type EntitlementsKey =
  | "monitorsMax"
  | "notificationChannelsMax"
  | "statusPagesMax"
  | "checksIntervalMsMin"
  | "teamsMax";
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
  entitlement: EntitlementsKey | null;
  entitlementCount: number;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const ent = useSelector((s: RootState) => s.auth.user?.entitlements);
  const limitReached = useMemo(() => {
    if (!entitlement) return false;
    if (!ent || typeof ent[entitlement] !== "number") return false;
    return entitlementCount < ent[entitlement] ? false : true;
  }, [ent, entitlement, entitlementCount]);
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
            color="accent"
            disabled={limitReached}
            onClick={() => navigate(path)}
          >
            {limitReached
              ? "Your plan's limit has been reached"
              : label || t("createNew")}
          </Button>
        </span>
      </Tooltip>
    </Stack>
  );
};

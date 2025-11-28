import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import { BasePage, ConfigBox } from "@/components/design-elements";
import {
  AutoComplete,
  Select,
  LanguageSelector,
  Button,
  RadioWithDescription,
  Dialog,
} from "@/components/inputs";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import DummyChart from "@/pages/settings/DummyChart";

import { useTheme } from "@mui/material/styles";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { setTimezone, setMode, setChartType } from "@/features/uiSlice";
import { useAppSelector, useAppDispatch } from "@/hooks/AppHooks";
import timezones from "@/utils/timezones.json";
import type { ITimeZone } from "@/types/timezone";
import type { SelectChangeEvent } from "@mui/material/Select";
import { useDelete } from "@/hooks/UseApi";

const SettingsPage = () => {
  const user = useAppSelector((state) => state.auth.user);

  const orgPermissions = user?.org?.permissions || [];
  const hasMaster = orgPermissions.includes("master");
  const hasDelete =
    orgPermissions.includes("monitors.*") ||
    orgPermissions.includes("monitors.delete") ||
    hasMaster;

  const theme = useTheme();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const timezone = useAppSelector((state) => state.ui.timezone);
  const mode = useAppSelector((state) => state.ui.mode);
  const chartType = useAppSelector((state) => state.ui.chartType);
  const [selectedTimezone, setSelectedTimezone] = useState<ITimeZone | null>(
    null
  );
  useEffect(() => {
    const tz = timezones.find((tz) => tz._id === timezone);
    setSelectedTimezone(tz || null);
  }, [timezone]);

  const { deleteFn, loading: isDeleting } = useDelete();

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleOpen = () => setIsDialogOpen(true);
  const handleCancel = () => setIsDialogOpen(false);
  const handleConfirm = async () => {
    await deleteFn("/monitors");
    setIsDialogOpen(false);
  };

  return (
    <BasePage>
      <ConfigBox
        title="UI Settings"
        subtitle="Configure time zone, UI mode, and language preferences"
        rightContent={
          <Stack spacing={theme.spacing(10)}>
            <Stack spacing={theme.spacing(2)}>
              <Typography>Time zone</Typography>

              <AutoComplete
                value={selectedTimezone}
                options={timezones as ITimeZone[]}
                getOptionLabel={(option) => option.name}
                onChange={(_, timezone: ITimeZone) => {
                  dispatch(setTimezone(timezone._id));
                }}
              />
            </Stack>
            <Stack spacing={theme.spacing(2)}>
              <Typography>UI Mode</Typography>
              <Select
                value={mode}
                onChange={(e: SelectChangeEvent<string>) => {
                  dispatch(setMode(e.target.value));
                }}
              >
                <MenuItem value="light">Light</MenuItem>
                <MenuItem value="dark">Dark</MenuItem>
              </Select>
            </Stack>

            <Stack spacing={theme.spacing(2)}>
              <Typography>Language</Typography>
              <LanguageSelector />
            </Stack>
          </Stack>
        }
      />
      <ConfigBox
        title="Chart settings"
        subtitle="Choose what type of Uptime chart you want to see on the dashboard and status page"
        leftContent={<DummyChart type={chartType} />}
        rightContent={
          <Stack gap={theme.spacing(4)}>
            <Typography>Chart Type</Typography>
            <Stack gap={theme.spacing(4)}>
              <RadioWithDescription
                checked={chartType === "heatmap"}
                onChange={() => dispatch(setChartType("heatmap"))}
                value="heatmap"
                label="Heatmap"
                description="Compact tiles; color shows response speed, top strip shows availability."
                name="chart-type"
              />
              <RadioWithDescription
                checked={chartType === "histogram"}
                onChange={() => dispatch(setChartType("histogram"))}
                value="histogram"
                label="Histogram"
                description="One bar per check; height shows response time, color shows status."
                name="chart-type"
              />
            </Stack>
          </Stack>
        }
      />
      {hasDelete && (
        <ConfigBox
          title="Monitors"
          subtitle="Monitor related settings"
          rightContent={
            <Stack gap={theme.spacing(4)}>
              <Box>
                <Button variant="contained" color="error" onClick={handleOpen}>
                  Remove all monitors
                </Button>
              </Box>
              <Typography>
                Removes all monitors from your organization.
              </Typography>
            </Stack>
          }
        />
      )}

      <Dialog
        open={isDialogOpen}
        title={t("settings.removeAllMonitors.title", "Delete all monitors?")}
        content={t(
          "settings.removeAllMonitors.description",
          "This action cannot be undone. Are you sure you want to remove all monitors?"
        )}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        loading={isDeleting}
      />
    </BasePage>
  );
};

export default SettingsPage;

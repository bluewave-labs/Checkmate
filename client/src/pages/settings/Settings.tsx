import Stack from "@mui/material/Stack";
import { BasePage, ConfigBox } from "@/components/design-elements";
import { AutoComplete, Select, LanguageSelector } from "@/components/inputs";
import { RadioWithDescription } from "@/components/inputs/RadioInput";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import { SettingsForm } from "@/pages/settings/SettingsForm";

import type { ChartType } from "@/features/uiSlice";
import { useTheme } from "@mui/material/styles";
import { useEffect, useMemo, useState } from "react";
import { setTimezone, setMode, setChartType } from "@/features/uiSlice";
import { useAppSelector, useAppDispatch } from "@/hooks/AppHooks";
import timezones from "@/utils/timezones.json";
import type { ITimeZone } from "@/types/timezone";
import type { SelectChangeEvent } from "@mui/material/Select";
import { useGet, usePatch, usePost } from "@/hooks/UseApi";
import type { ApiResponse } from "@/hooks/UseApi";
import { z } from "zod";
import { systemSettingsSchema } from "@/validation/zod";
import DummyChart from "./DummyChart";

const SettingsPage = () => {
  type FormValues = z.infer<typeof systemSettingsSchema>;

  const user = useAppSelector((state) => state.auth.user);

  const orgPermissions = user?.org?.permissions || [];
  const hasMaster = orgPermissions.includes("master");

  const theme = useTheme();
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

  const { post, loading: posting } = usePost<Partial<FormValues>, any>();
  const { patch, loading: patching } = usePatch<Partial<FormValues>, any>();

  const { response, loading } = useGet<ApiResponse<any>>(
    hasMaster ? "/settings" : null
  );
  const settings = response?.data || {};
  const initialSettings = useMemo(() => settings, [settings]);

  const onSubmit = async (data: Partial<FormValues>) => {
    await patch("/settings/email", data);
  };

  const onTest = async (data: Partial<FormValues>) => {
    await post("/settings/test-transport", data);
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
      {hasMaster && (
        <SettingsForm
          onSubmit={onSubmit}
          onTest={onTest}
          initialData={initialSettings}
          loading={posting || loading || patching}
        />
      )}
    </BasePage>
  );
};

export default SettingsPage;

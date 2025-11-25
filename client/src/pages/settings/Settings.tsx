import Stack from "@mui/material/Stack";
import { BasePage, ConfigBox } from "@/components/design-elements";
import { AutoComplete, Select, LanguageSelector } from "@/components/inputs";
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
          <Stack spacing={theme.spacing(2)}>
            <Typography>Chart Type</Typography>
            <Select
              value={chartType}
              onChange={(e: SelectChangeEvent<string>) => {
                dispatch(setChartType(e.target.value as ChartType));
              }}
            >
              <MenuItem value="heatmap">Heatmap</MenuItem>
              <MenuItem value="histogram">Histogram</MenuItem>
            </Select>
            <Typography>
              {chartType === "heatmap"
                ? "Heatmap: colored line indicates status"
                : "Bar chart: color denotes status (up/down). height denotes response time"}
            </Typography>
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

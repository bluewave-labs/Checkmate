import Stack from "@mui/material/Stack";
import { BasePage, ConfigBox } from "@/components/design-elements";
import { AutoComplete, Select, LanguageSelector } from "@/components/inputs";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import { SettingsForm } from "@/pages/settings/SettingsForm";

import { useTheme } from "@mui/material/styles";
import { useEffect, useMemo, useState } from "react";
import { setTimezone, setMode } from "@/features/uiSlice";
import { useAppSelector, useAppDispatch } from "@/hooks/AppHooks";
import timezones from "@/utils/timezones.json";
import type { ITimeZone } from "@/types/timezone";
import type { SelectChangeEvent } from "@mui/material/Select";
import { useGet, usePatch, usePost } from "@/hooks/UseApi";
import type { ApiResponse } from "@/hooks/UseApi";
import { z } from "zod";
import { systemSettingsSchema } from "@/validation/zod";

const SettingsPage = () => {
  type FormValues = z.infer<typeof systemSettingsSchema>;

  const theme = useTheme();
  const dispatch = useAppDispatch();
  const timezone = useAppSelector((state) => state.ui.timezone);
  const mode = useAppSelector((state) => state.ui.mode);
  const [selectedTimezone, setSelectedTimezone] = useState<ITimeZone | null>(
    null
  );
  useEffect(() => {
    const tz = timezones.find((tz) => tz._id === timezone);
    setSelectedTimezone(tz || null);
  }, [timezone]);

  const { post, loading: posting } = usePost<Partial<FormValues>, any>();
  const { patch, loading: patching } = usePatch<Partial<FormValues>, any>();

  const { response, loading } = useGet<ApiResponse<any>>("/settings");
  const settings = response?.data || {};
  const initialSettings = useMemo(() => settings, [settings]);

  const onSubmit = async (data: Partial<FormValues>) => {
    const res = await patch("/settings/email", data);
  };

  const onTest = async (data: Partial<FormValues>) => {
    const res = await post("/settings/test-transport", data);
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
      <SettingsForm
        onSubmit={onSubmit}
        onTest={onTest}
        initialData={initialSettings}
        loading={posting || loading || patching}
      />
    </BasePage>
  );
};

export default SettingsPage;

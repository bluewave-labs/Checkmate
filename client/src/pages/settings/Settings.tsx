import Stack from "@mui/material/Stack";
import { BasePage, ConfigBox } from "@/components/design-elements";
import { AutoComplete, Select, LanguageSelector } from "@/components/inputs";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";

import { useTheme } from "@mui/material/styles";
import { useEffect, useState } from "react";
import { setTimezone, setMode } from "@/features/uiSlice";
import { useAppSelector, useAppDispatch } from "@/hooks/AppHooks";
import timezones from "@/utils/timezones.json";
import type { ITimeZone } from "@/types/timezone";
import type { SelectChangeEvent } from "@mui/material/Select";

const SettingsPage = () => {
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
  return (
    <BasePage>
      <ConfigBox
        title="UI Settings"
        subtitle="Configure time zone, UI mode, and language preferences"
        rightContent={
          <Stack spacing={theme.spacing(8)}>
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
    </BasePage>
  );
};

export default SettingsPage;

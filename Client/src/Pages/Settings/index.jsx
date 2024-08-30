import { useTheme } from "@emotion/react";
import { Box, Stack, styled, Typography } from "@mui/material";
import Button from "../../Components/Button";
import Field from "../../Components/Inputs/Field";
import Link from "../../Components/Link";
import Select from "../../Components/Inputs/Select";
import { logger } from "../../Utils/Logger";
import "./index.css";

const Settings = () => {
  const theme = useTheme();

  const ConfigBox = styled("div")({
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.spacing(20),
    paddingTop: theme.spacing(12),
    paddingInline: theme.spacing(15),
    paddingBottom: theme.spacing(25),
    backgroundColor: theme.palette.background.main,
    border: 1,
    borderStyle: "solid",
    borderColor: theme.palette.border.light,
    borderRadius: theme.spacing(2),
    "& > div:first-of-type": {
      flex: 0.7,
    },
    "& > div:last-of-type": {
      flex: 1,
    },
    "& h1, & h2": {
      color: theme.palette.text.secondary,
    },
    "& p": {
      color: theme.palette.text.tertiary,
    },
  });

  return (
    <Box
      className="settings"
      style={{
        paddingBottom: 0,
      }}
    >
      <Stack
        component="form"
        gap={theme.spacing(12)}
        noValidate
        spellCheck="false"
      >
        <ConfigBox>
          <Box>
            <Typography component="h1">General Settings</Typography>
            <Typography sx={{ mt: theme.spacing(2), mb: theme.spacing(2) }}>
              <Typography component="span">Display timezone</Typography>- The
              timezone of the dashboard you publicly display.
            </Typography>
            <Typography>
              <Typography component="span">Server timezone</Typography>- The
              timezone of your server.
            </Typography>
          </Box>
          <Stack gap={theme.spacing(20)}>
            <Select
              id="display-timezone"
              label="Display timezone"
              value="est"
              onChange={() => logger.warn("disabled")}
              items={[{ _id: "est", name: "America / Toronto" }]}
            />
            <Select
              id="server-timezone"
              label="Server timezone"
              value="est"
              onChange={() => logger.warn("disabled")}
              items={[{ _id: "est", name: "America / Toronto" }]}
            />
          </Stack>
        </ConfigBox>
        <ConfigBox>
          <Box>
            <Typography component="h1">History and monitoring</Typography>
            <Typography sx={{ mt: theme.spacing(2) }}>
              Define here for how long you want to keep the data. You can also
              remove all past data.
            </Typography>
          </Box>
          <Stack gap={theme.spacing(20)}>
            <Field
              type="text"
              id="history-monitoring"
              label="The days you want to keep monitoring history."
              isOptional={true}
              optionalLabel="0 for infinite"
              placeholder="90"
              value=""
              onChange={() => logger.warn("Disabled")}
            />
            <Box>
              <Typography>Clear all stats. This is irreversible.</Typography>
              <Button
                level="error"
                label="Clear all stats"
                sx={{ mt: theme.spacing(4) }}
              />
            </Box>
          </Stack>
        </ConfigBox>
        <ConfigBox>
          <Box>
            <Typography component="h1">About</Typography>
          </Box>
          <Box>
            <Typography component="h2">BlueWave Uptime v1.0.0</Typography>
            <Typography
              sx={{ mt: theme.spacing(2), mb: theme.spacing(6), opacity: 0.6 }}
            >
              Developed by Bluewave Labs.
            </Typography>
            <Link
              level="secondary"
              url="https://github.com/bluewave-labs"
              label="https://github.com/bluewave-labs"
            />
          </Box>
        </ConfigBox>
        <Stack direction="row" justifyContent="flex-end">
          <Button
            level="primary"
            label="Save"
            sx={{ px: theme.spacing(12), mt: theme.spacing(20) }}
          />
        </Stack>
      </Stack>
    </Box>
  );
};

export default Settings;

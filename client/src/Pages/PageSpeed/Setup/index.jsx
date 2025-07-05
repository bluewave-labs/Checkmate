// Components
import { Box, Stack, Tooltip, Typography, Button, ButtonGroup } from "@mui/material";
import ConfigBox from "../../../Components/ConfigBox";
import Select from "../../../Components/Inputs/Select";
import TextInput from "../../../Components/Inputs/TextInput";
import PauseCircleOutlineIcon from "@mui/icons-material/PauseCircleOutline";
import Breadcrumbs from "../../../Components/Breadcrumbs";
import PulseDot from "../../../Components/Animated/PulseDot";
import PlayCircleOutlineRoundedIcon from "@mui/icons-material/PlayCircleOutlineRounded";
import SkeletonLayout from "./skeleton";
import NotificationsConfig from "../../../Components/NotificationConfig";
import Dialog from "../../../Components/Dialog";
import { HttpAdornment } from "../../../Components/Inputs/TextInput/Adornments";
import Radio from "../../../Components/Inputs/Radio";


// Utils
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { monitorValidation } from "../../../Validation/validation";
import { parseDomainName } from "../../../Utils/monitorUtils";
import { useTranslation } from "react-i18next";
import { useGetNotificationsByTeamId } from "../../../Hooks/useNotifications";
import { useTheme } from "@emotion/react";
import { createToast } from "../../../Utils/toastUtils";

import { useParams } from "react-router";
import { useMonitorUtils } from "../../../Hooks/useMonitorUtils";
import {
  useCreateMonitor,
  useFetchMonitorById,
  useDeleteMonitor,
  useUpdateMonitor,
  usePauseMonitor,
} from "../../../Hooks/monitorHooks";

const MS_PER_MINUTE = 60000;
const SELECT_VALUES = [
  { _id: 3, name: "3 minutes" },
  { _id: 5, name: "5 minutes" },
  { _id: 10, name: "10 minutes" },
  { _id: 20, name: "20 minutes" },
  { _id: 60, name: "1 hour" },
  { _id: 1440, name: "1 day" },
  { _id: 10080, name: "1 week" },
];

const PageSpeedSetup = ({ monitor }) => {
  const isConfigure = monitor;
  const { t } = useTranslation();
  const theme = useTheme();
  const { monitorId } = useParams();
  const { statusColor, pagespeedStatusMsg, determineState } = useMonitorUtils();
  const [notifications, notificationsAreLoading] = useGetNotificationsByTeamId();
  const [https, setHttps] = useState(true);
  const [errors, setErrors] = useState({});
  const [isOpen, setIsOpen] = useState(false);
  const [updateTrigger, setUpdateTrigger] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isPausing, setIsPausing] = useState(false);

  // Monitor state
  const [monitorData, setMonitorData] = useState({
    url: "",
    name: "",
    type: "pagespeed",
    notifications: [],
    interval: 3,
  });

  // Hooks for API actions
  const [createMonitor, isCreating] = useCreateMonitor();
  const [fetchMonitor] = monitor
    ? useFetchMonitorById({ monitorId, setMonitor: setMonitorData, updateTrigger })
    : [null];
  const [deleteMonitor] = useDeleteMonitor();
  const [updateMonitor] = useUpdateMonitor();
  const [pauseMonitor] = usePauseMonitor();

	const frequencies = [
		{ _id: 3, name: "3 minutes" },
		{ _id: 5, name: "5 minutes" },
		{ _id: 10, name: "10 minutes" },
		{ _id: 20, name: "20 minutes" },
		{ _id: 60, name: "1 hour" },
		{ _id: 1440, name: "1 day" },
		{ _id: 10080, name: "1 week" },
	];

  // Fetch monitor if in configure mode
  useEffect(() => {
    if (monitor && monitorId && typeof fetchMonitor === 'function') {
      setIsLoading(true);
      fetchMonitor().finally(() => setIsLoading(false));
    }
  }, [monitor, monitorId, updateTrigger, fetchMonitor]);

  // Handlers

  const handleChange = (event) => {
    let { value, name } = event.target;
    if (name === "interval") {
      value = value * MS_PER_MINUTE;
    }
    setMonitorData((prev) => ({
      ...prev,
      [name]: value
    }));
    const validation = monitorValidation.validate(
      { [name]: value },
      { abortEarly: false }
    );

    setErrors((prev) => {
      const updatedErrors = { ...prev };
      if (validation.error) {
        updatedErrors[name] = validation.error.details[0].message;
      } else {
        delete updatedErrors[name];
      }
      return updatedErrors;
    });
  };

  const handleBlur = (event) => {
    const { name, value } = event.target;
    if (name === "url" && monitorData.name === "") {
      setMonitorData((prev) => ({ ...prev, name: parseDomainName(value) }));
    }
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (isConfigure) {
      setIsUpdating(true);
      await updateMonitor({ monitor: monitorData, redirect: "/pagespeed" });
      setIsUpdating(false);
    } else {
      let form = {
        url: `http${https ? "s" : ""}://` + monitorData.url,
        name: monitorData.name === "" ? monitorData.url : monitorData.name,
        type: monitorData.type,
        interval: monitorData.interval * MS_PER_MINUTE,
        description: monitorData.name === "" ? monitorData.url : monitorData.name,
        notifications: monitorData.notifications,
      };
      const { error } = monitorValidation.validate(form, { abortEarly: false });
      if (error) {
        const newErrors = {};
        error.details.forEach((err) => {
          newErrors[err.path[0]] = err.message;
        });
        setErrors(newErrors);
        createToast({ body: "Please check the form for errors." });
        return;
      }
      setIsLoading(true);
      await createMonitor({ monitor: form, redirect: "/pagespeed" });
      setIsLoading(false);
    }
  };

  const handlePause = async () => {
    setIsPausing(true);
    await pauseMonitor({ monitorId, triggerUpdate: () => setUpdateTrigger((u) => !u) });
    setIsPausing(false);
  };

  const handleRemove = async (event) => {
    event.preventDefault();
    setIsDeleting(true);
    await deleteMonitor({ monitor: monitorData, redirect: "/pagespeed" });
    setIsDeleting(false);
  };

  // Loading skeleton
  if (isConfigure && (isLoading || !monitorData._id)) {
    return <SkeletonLayout />;
  }

  return (
    <Box
      className={isConfigure ? "configure-pagespeed" : "create-monitor"}
      sx={{
        "& h1": { color: theme.palette.primary.contrastText },
      }}
    >
      <Breadcrumbs
        list={
          isConfigure
            ? [
                { name: "pagespeed", path: "/pagespeed" },
                { name: "details", path: `/pagespeed/${monitorId}` },
                { name: "configure", path: `/pagespeed/setup/${monitorId}` },
              ]
            : [
                { name: "pagespeed", path: "/pagespeed" },
                { name: "create", path: `/pagespeed/setup` },
              ]
        }
      />
      <Stack
        component="form"
        className={isConfigure ? undefined : "create-monitor-form"}
        onSubmit={onSubmit}
        noValidate
        spellCheck="false"
        gap={theme.spacing(12)}
        mt={theme.spacing(6)}
      >
        <Typography component="h1" variant="h1">
          <Typography component="span" fontSize="inherit">
            {isConfigure ? monitorData.name : t("createYour") + " "}
          </Typography>
          { !isConfigure 
            ? (
            <Typography
              component="span"
              fontSize="inherit"
              fontWeight="inherit"
              color={theme.palette.primary.contrastTextSecondary}
            >
              {t("pageSpeedMonitor")}
            </Typography>
            )
            : <></>
          }
        </Typography>
        {isConfigure && (
          <Stack direction="row" gap={theme.spacing(2)}>
            <Box>
              <Stack direction="row" alignItems="center" height="fit-content" gap={theme.spacing(2)}>
                <Tooltip
                  title={pagespeedStatusMsg[determineState(monitorData)]}
                  disableInteractive
                  slotProps={{
                    popper: {
                      modifiers: [
                        {
                          name: "offset",
                          options: { offset: [0, -8] },
                        },
                      ],
                    },
                  }}
                >
                  <Box>
                    <PulseDot color={statusColor[determineState(monitorData)]} />
                  </Box>
                </Tooltip>
                <Typography component="h2" variant="monitorUrl">
                  {monitorData.url?.replace(/^https?:\/\//, "") || "..."}
                </Typography>
                <Typography
                  position="relative"
                  variant="body2"
                  ml={theme.spacing(6)}
                  mt={theme.spacing(1)}
                  sx={{
                    "&:before": {
                      position: "absolute",
                      content: `""`,
                      width: 4,
                      height: 4,
                      borderRadius: "50%",
                      backgroundColor: theme.palette.primary.contrastTextTertiary,
                      opacity: 0.8,
                      left: -10,
                      top: "50%",
                      transform: "translateY(-50%)",
                    },
                  }}
                >
                  {t("editing")}
                </Typography>
              </Stack>
            </Box>
            <Box alignSelf="flex-end" ml="auto">
              <Button
                onClick={handlePause}
                loading={isLoading}
                variant="contained"
                color="secondary"
                sx={{
                  pl: theme.spacing(4),
                  pr: theme.spacing(6),
                  "& svg": {
                    mr: theme.spacing(2),
                    "& path": {
                      stroke: theme.palette.primary.contrastTextTertiary,
                      strokeWidth: 0.1,
                    },
                  },
                }}
              >
                {monitorData?.isActive ? (
                  <>
                    <PauseCircleOutlineIcon />
                    {t("pause")}
                  </>
                ) : (
                  <>
                    <PlayCircleOutlineRoundedIcon />
                    {t("resume")}
                  </>
                )}
              </Button>
              <Button
                loading={isLoading}
                variant="contained"
                color="error"
                onClick={() => setIsOpen(true)}
                sx={{ ml: theme.spacing(6) }}
              >
                {t("remove")}
              </Button>
            </Box>
          </Stack>
        )}
        <ConfigBox>
          <Box>
            <Typography component="h2" variant="h2">
              {t("settingsGeneralSettings")}
            </Typography>
            <Typography component="p">
              {isConfigure ? t("pageSpeedConfigureSettingsDescription") : t("distributedUptimeCreateSelectURL")}
            </Typography>
          </Box>
          <Stack gap={isConfigure ? theme.spacing(20) : theme.spacing(15)}>
            <TextInput
              type={"url"}
              name="url"
              id="monitor-url"
              label={t("url")}
              startAdornment={!isConfigure ? <HttpAdornment https={https} /> : undefined}
              placeholder={isConfigure ? "random.website.com" : "google.com"}
              value={monitorData.url || ""}
              onChange={handleChange}
              onBlur={!isConfigure ? handleBlur : undefined}
              error={!!errors["url"]}
              helperText={errors["url"]}
              disabled={isConfigure}
            />
            <TextInput
              type="text"
              id="monitor-name"
              name="name"
              label={t("monitorDisplayName")}
              isOptional={true}
              placeholder={isConfigure ? "Example monitor" : "Google"}
              value={monitorData.name || ""}
              onChange={handleChange}
              error={!!errors["name"]}
              helperText={errors["name"]}
            />
          </Stack>
        </ConfigBox>
        {!isConfigure && (
          <ConfigBox>
            <Box>
              <Typography component="h2" variant="h2">
                {t("distributedUptimeCreateChecks")}
              </Typography>
              <Typography component="p">
                {t("distributedUptimeCreateChecksDescription")}
              </Typography>
            </Box>
            <Stack gap={theme.spacing(12)}>
              <Stack gap={theme.spacing(6)}>
                <Radio
                  id="monitor-checks-http"
                  title="PageSpeed"
                  desc="Use the Lighthouse PageSpeed API to monitor your website"
                  size="small"
                  value="http"
                  checked={monitorData.type === "pagespeed"}
                />
                <ButtonGroup sx={{ ml: "32px" }}>
                  <Button
                    variant="group"
                    filled={https.toString()}
                    onClick={() => setHttps(true)}
                  >
                    {t("https")}
                  </Button>
                  <Button
                    variant="group"
                    filled={(!https).toString()}
                    onClick={() => setHttps(false)}
                  >
                    {t("http")}
                  </Button>
                </ButtonGroup>
              </Stack>
              {errors["type"] ? (
                <Box className="error-container">
                  <Typography component="p" className="input-error" color={theme.palette.error.contrastText}>
                    {errors["type"]}
                  </Typography>
                </Box>
              ) : null}
            </Stack>
          </ConfigBox>
        )}
        <ConfigBox>
          <Box>
            <Typography component="h2" variant="h2">
              {t("notificationConfig.title")}
            </Typography>
            <Typography component="p">{t("notificationConfig.description")}</Typography>
          </Box>
          <NotificationsConfig
            notifications={notifications}
            setMonitor={setMonitorData}
            setNotifications={isConfigure ? monitorData.notifications : undefined}
          />
        </ConfigBox>
        <ConfigBox>
          <Box>
            <Typography component="h2" variant="h2">
              {t("distributedUptimeCreateAdvancedSettings")}
            </Typography>
          </Box>
          <Stack gap={isConfigure ? theme.spacing(20) : theme.spacing(12)}>
            <Select
              name="interval"
              label={t("checkFrequency")}
              value={isConfigure ? monitorData.interval / MS_PER_MINUTE || 3 : monitorData.interval || 3}
              onChange={handleChange}
              items={frequencies}
            />
          </Stack>
        </ConfigBox>
        <Stack direction="row" justifyContent="flex-end" mt={isConfigure ? "auto" : undefined}>
          <Button
            type="submit"
            variant="contained"
            color="accent"
            disabled={!Object.values(errors).every((value) => value === undefined)}
            loading={isLoading || isDeleting || isUpdating || isPausing || isCreating}
            sx={isConfigure ? { px: theme.spacing(12) } : undefined}
          >
            {isConfigure ? t("settingsSave") : t("createMonitor")}
          </Button>
        </Stack>
      </Stack>
      {isConfigure && (
        <Dialog
          open={isOpen}
          theme={theme}
          title={t("deleteDialogTitle")}
          description={t("deleteDialogDescription")}
          onCancel={() => setIsOpen(false)}
          confirmationButtonLabel={t("delete")}
          onConfirm={handleRemove}
          isLoading={isLoading || isDeleting || isUpdating || isPausing}
        />
      )}
    </Box>
  );
};

export default PageSpeedSetup;


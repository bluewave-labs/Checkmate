import { Button, Box } from "@mui/material";
import { useTheme } from "@emotion/react";
import PropTypes from "prop-types";
import PauseCircleOutlineIcon from "@mui/icons-material/PauseCircleOutline";
import PlayCircleOutlineRoundedIcon from "@mui/icons-material/PlayCircleOutlineRounded";
import { useTranslation } from "react-i18next";
import { pauseUptimeMonitor } from "../../Features/UptimeMonitors/uptimeMonitorsSlice";
import { useDispatch } from "react-redux";
import { createToast } from "../../Utils/toastUtils";
import { useState } from "react";

const actionMap = {
  uptime: pauseUptimeMonitor,
};

const MonitorPauseButton = ({ monitor, path, isLoading, setMonitorIsActive }) => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const { t } = useTranslation();
  const [optimisticIsActive, setOptimisticIsActive] = useState(monitor?.isActive);

  if (!monitor) return null;

  const handlePause = async (e) => {
    e?.stopPropagation?.();

    const monitorId = monitor?._id;
    const actionCreator = actionMap[path];

    if (!actionCreator || !monitorId) {
      return createToast({ body: "Pause action not available." });
    }

    try {
      const action = await dispatch(actionCreator({ monitorId }));

      if (actionCreator.fulfilled.match(action)) {
        setOptimisticIsActive(!optimisticIsActive);
        const state = optimisticIsActive ? "paused" : "resumed";
        setMonitorIsActive(optimisticIsActive);
        createToast({ body: `Monitor ${state} successfully.` });
      } else {
        throw new Error(action.error?.message || "Failed to pause/resume monitor");
      }
    } catch (err) {
      // Revert optimistic update on failure
      setMonitorIsActive(!optimisticIsActive);
      createToast({ body: "Failed to pause/resume monitor." });
    }
  };

  return (
    <Box alignSelf="flex-end">
      <Button
        onClick={handlePause}
        variant="contained"
        color="secondary"
        disabled={isLoading}
        sx={{ px: theme.spacing(5) }}
      >
        {optimisticIsActive ? (
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
    </Box>
  );
};

MonitorPauseButton.propTypes = {
  monitor: PropTypes.object.isRequired,
  path: PropTypes.string.isRequired,
  isLoading: PropTypes.bool,
  setMonitorIsActive: PropTypes.func.isRequired,
};

export default MonitorPauseButton;
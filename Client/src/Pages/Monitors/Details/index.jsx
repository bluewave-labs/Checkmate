import PropTypes from "prop-types";
import { useEffect, useState, useCallback } from "react";
import {
  Box,
  Button,
  Popover,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { networkService } from "../../../main";
import { logger } from "../../../Utils/Logger";
import {
  formatDate,
  formatDurationRounded,
  formatDurationSplit,
} from "../../../Utils/timeUtils";
import MonitorDetailsAreaChart from "../../../Components/Charts/MonitorDetailsAreaChart";
import ButtonGroup from "@mui/material/ButtonGroup";
import SettingsIcon from "../../../assets/icons/settings-bold.svg?react";
import CertificateIcon from "../../../assets/icons/certificate.svg?react";
import UptimeIcon from "../../../assets/icons/uptime-icon.svg?react";
import ResponseTimeIcon from "../../../assets/icons/response-time-icon.svg?react";
import AverageResponseIcon from "../../../assets/icons/average-response-icon.svg?react";
import IncidentsIcon from "../../../assets/icons/incidents.svg?react";
import HistoryIcon from "../../../assets/icons/history-icon.svg?react";
import PaginationTable from "./PaginationTable";
import Breadcrumbs from "../../../Components/Breadcrumbs";
import PulseDot from "../../../Components/Animated/PulseDot";
import { StatBox, ChartBox, IconBox } from "./styled";
import { DownBarChart, ResponseGaugeChart, UpBarChart } from "./Charts";
import SkeletonLayout from "./skeleton";
import "./index.css";

/**
 * Details page component displaying monitor details and related information.
 * @component
 */
const DetailsPage = ({ isAdmin }) => {
  const theme = useTheme();
  const [monitor, setMonitor] = useState({});
  const { monitorId } = useParams();
  const { authToken } = useSelector((state) => state.auth);
  const [dateRange, setDateRange] = useState("day");
  const [certificateExpiry, setCertificateExpiry] = useState("N/A");
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = useState(null);
  const openCertificate = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const closeCertificate = () => {
    setAnchorEl(null);
  };

  const fetchMonitor = useCallback(async () => {
    try {
      const res = await networkService.getStatsByMonitorId(
        authToken,
        monitorId,
        null,
        null,
        dateRange,
        50,
        true
      );
      setMonitor(res?.data?.data ?? {});
    } catch (error) {
      logger.error(error);
      navigate("/not-found", { replace: true });
    }
  }, [authToken, monitorId, navigate, dateRange]);

  useEffect(() => {
    fetchMonitor();
  }, [fetchMonitor]);

  useEffect(() => {
    const fetchCertificate = async () => {
      if (monitor?.type !== "http") {
        return;
      }
      try {
        const res = await networkService.getCertificateExpiry(
          authToken,
          monitorId
        );

        let [month, day, year] = res?.data?.data?.certificateDate.split("/");
        const date = new Date(year, month - 1, day);

        setCertificateExpiry(
          formatDate(date, {
            hour: undefined,
            minute: undefined,
          }) ?? "N/A"
        );
      } catch (error) {
        console.error(error);
      }
    };
    fetchCertificate();
  }, [authToken, monitorId, monitor]);

  const splitDuration = (duration) => {
    const { time, format } = formatDurationSplit(duration);
    return (
      <>
        {time}
        <Typography component="span">{format}</Typography>
      </>
    );
  };

  let loading = Object.keys(monitor).length === 0;

  const [hoveredUptimeData, setHoveredUptimeData] = useState(null);
  const [hoveredIncidentsData, setHoveredIncidentsData] = useState(null);

  const statusColor = {
    true: theme.palette.success.main,
    false: theme.palette.error.main,
    undefined: theme.palette.warning.main,
  };

  const statusMsg = {
    true: "Your site is up.",
    false: "Your site is down.",
    undefined: "Pending...",
  };

  return (
    <Box className="monitor-details">
      {loading ? (
        <SkeletonLayout />
      ) : (
        <>
          <Breadcrumbs
            list={[
              { name: "monitors", path: "/monitors" },
              { name: "details", path: `/monitors/${monitorId}` },
            ]}
          />
          <Stack gap={theme.spacing(10)} mt={theme.spacing(10)}>
            <Stack direction="row" gap={theme.spacing(2)}>
              <Box>
                <Typography
                  component="h1"
                  fontSize={22}
                  fontWeight={500}
                  color={theme.palette.text.primary}
                >
                  {monitor.name}
                </Typography>
                <Stack
                  direction="row"
                  alignItems="center"
                  height="fit-content"
                  gap={theme.spacing(2)}
                >
                  <Tooltip
                    title={statusMsg[monitor?.status ?? undefined]}
                    disableInteractive
                    slotProps={{
                      popper: {
                        modifiers: [
                          {
                            name: "offset",
                            options: {
                              offset: [0, -8],
                            },
                          },
                        ],
                      },
                    }}
                  >
                    <Box>
                      <PulseDot
                        color={statusColor[monitor?.status ?? undefined]}
                      />
                    </Box>
                  </Tooltip>
                  <Typography
                    component="h2"
                    fontSize={14.5}
                    color={theme.palette.text.secondary}
                  >
                    {monitor.url?.replace(/^https?:\/\//, "") || "..."}
                  </Typography>
                  <Typography
                    mt={theme.spacing(1)}
                    ml={theme.spacing(6)}
                    fontSize={12}
                    position="relative"
                    color={theme.palette.text.tertiary}
                    sx={{
                      "&:before": {
                        position: "absolute",
                        content: `""`,
                        width: 4,
                        height: 4,
                        borderRadius: "50%",
                        backgroundColor: theme.palette.text.tertiary,
                        opacity: 0.8,
                        left: -9,
                        top: "50%",
                        transform: "translateY(-50%)",
                      },
                    }}
                  >
                    Checking every {formatDurationRounded(monitor?.interval)}.
                  </Typography>
                </Stack>
              </Box>
              <Stack
                direction="row"
                height={34}
                sx={{
                  ml: "auto",
                  alignSelf: "flex-end",
                }}
              >
                <IconBox
                  mr={theme.spacing(4)}
                  onClick={openCertificate}
                  sx={{
                    cursor: "pointer",
                  }}
                >
                  <CertificateIcon />
                </IconBox>
                <Popover
                  id="certificate-dropdown"
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={closeCertificate}
                  disableScrollLock
                  marginThreshold={null}
                  anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "center",
                  }}
                  transformOrigin={{
                    vertical: "top",
                    horizontal: "center",
                  }}
                  slotProps={{
                    paper: {
                      sx: {
                        mt: theme.spacing(4),
                        py: theme.spacing(2),
                        px: theme.spacing(4),
                        width: 140,
                        backgroundColor: theme.palette.background.accent,
                      },
                    },
                  }}
                >
                  <Typography fontSize={12} color={theme.palette.text.tertiary}>
                    Certificate Expiry
                  </Typography>
                  <Typography
                    component="span"
                    fontSize={13}
                    color={theme.palette.text.primary}
                  >
                    {certificateExpiry}
                  </Typography>
                </Popover>
                {isAdmin && (
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => navigate(`/monitors/configure/${monitorId}`)}
                    sx={{
                      px: theme.spacing(5),
                      "& svg": {
                        mr: theme.spacing(3),
                        "& path": {
                          stroke: theme.palette.text.tertiary,
                        },
                      },
                    }}
                  >
                    <SettingsIcon /> Configure
                  </Button>
                )}
              </Stack>
            </Stack>
            <Stack direction="row" gap={theme.spacing(8)}>
              <StatBox
                sx={
                  monitor?.status === undefined
                    ? {
                        backgroundColor: theme.palette.warning.light,
                        borderColor: theme.palette.warning.border,
                        "& h2": { color: theme.palette.warning.main },
                      }
                    : monitor?.status
                    ? {
                        backgroundColor: theme.palette.success.bg,
                        borderColor: theme.palette.success.light,
                        "& h2": { color: theme.palette.success.main },
                      }
                    : {
                        backgroundColor: theme.palette.error.bg,
                        borderColor: theme.palette.error.light,
                        "& h2": { color: theme.palette.error.main },
                      }
                }
              >
                <Typography component="h2">active for</Typography>
                <Typography>
                  {splitDuration(monitor?.uptimeDuration)}
                </Typography>
              </StatBox>
              <StatBox>
                <Typography component="h2">last check</Typography>
                <Typography>
                  {splitDuration(monitor?.lastChecked)}
                  <Typography component="span">ago</Typography>
                </Typography>
              </StatBox>
              <StatBox>
                <Typography component="h2">last response time</Typography>
                <Typography>
                  {monitor?.latestResponseTime}
                  <Typography component="span">ms</Typography>
                </Typography>
              </StatBox>
            </Stack>
            <Box>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="flex-end"
                gap={theme.spacing(4)}
                mb={theme.spacing(8)}
              >
                <Typography fontSize={12} color={theme.palette.text.tertiary}>
                  Showing statistics for past{" "}
                  {dateRange === "day"
                    ? "24 hours"
                    : dateRange === "week"
                    ? "7 days"
                    : "30 days"}
                  .
                </Typography>
                <ButtonGroup sx={{ height: 32 }}>
                  <Button
                    variant="group"
                    filled={(dateRange === "day").toString()}
                    onClick={() => setDateRange("day")}
                  >
                    Day
                  </Button>
                  <Button
                    variant="group"
                    filled={(dateRange === "week").toString()}
                    onClick={() => setDateRange("week")}
                  >
                    Week
                  </Button>
                  <Button
                    variant="group"
                    filled={(dateRange === "month").toString()}
                    onClick={() => setDateRange("month")}
                  >
                    Month
                  </Button>
                </ButtonGroup>
              </Stack>
              <Stack direction="row" flexWrap="wrap" gap={theme.spacing(8)}>
                <ChartBox>
                  <Stack>
                    <IconBox>
                      <UptimeIcon />
                    </IconBox>
                    <Typography component="h2">Uptime</Typography>
                  </Stack>
                  <Stack justifyContent="space-between">
                    <Box position="relative">
                      <Typography>Total Checks</Typography>
                      <Typography component="span">
                        {hoveredUptimeData !== null
                          ? hoveredUptimeData.totalChecks
                          : monitor?.periodTotalChecks}
                      </Typography>
                      {hoveredUptimeData !== null &&
                        hoveredUptimeData.time !== null && (
                          <Typography
                            component="h5"
                            position="absolute"
                            top="100%"
                            fontSize={11}
                            color={theme.palette.text.tertiary}
                          >
                            {formatDate(new Date(hoveredUptimeData.time), {
                              month: "short",
                              year: undefined,
                              minute: undefined,
                              hour: dateRange === "day" ? "numeric" : undefined,
                            })}
                          </Typography>
                        )}
                    </Box>
                    <Box>
                      <Typography>Uptime Percentage</Typography>
                      <Typography component="span">
                        {hoveredUptimeData !== null
                          ? Math.floor(
                              hoveredUptimeData.uptimePercentage * 10
                            ) / 10
                          : Math.floor(monitor?.periodUptime * 10) / 10}
                        <Typography component="span">%</Typography>
                      </Typography>
                    </Box>
                  </Stack>
                  <UpBarChart
                    data={monitor?.aggregateData}
                    type={dateRange}
                    onBarHover={setHoveredUptimeData}
                  />
                </ChartBox>
                <ChartBox>
                  <Stack>
                    <IconBox>
                      <IncidentsIcon />
                    </IconBox>
                    <Typography component="h2">Incidents</Typography>
                  </Stack>
                  <Box position="relative">
                    <Typography>Total Incidents</Typography>
                    <Typography component="span">
                      {hoveredIncidentsData !== null
                        ? hoveredIncidentsData.totalIncidents
                        : monitor?.periodIncidents}
                    </Typography>
                    {hoveredIncidentsData !== null &&
                      hoveredIncidentsData.time !== null && (
                        <Typography
                          component="h5"
                          position="absolute"
                          top="100%"
                          fontSize={11}
                          color={theme.palette.text.tertiary}
                        >
                          {formatDate(new Date(hoveredIncidentsData.time), {
                            month: "short",
                            year: undefined,
                            minute: undefined,
                            hour: dateRange === "day" ? "numeric" : undefined,
                          })}
                        </Typography>
                      )}
                  </Box>
                  <DownBarChart
                    data={monitor?.aggregateData}
                    type={dateRange}
                    onBarHover={setHoveredIncidentsData}
                  />
                </ChartBox>
                <ChartBox justifyContent="space-between">
                  <Stack>
                    <IconBox>
                      <AverageResponseIcon />
                    </IconBox>
                    <Typography component="h2">
                      Average Response Time
                    </Typography>
                  </Stack>
                  <ResponseGaugeChart
                    data={[{ response: monitor?.periodAvgResponseTime }]}
                  />
                </ChartBox>
                <ChartBox
                  sx={{
                    "& tspan": {
                      fontSize: 11,
                    },
                  }}
                >
                  <Stack>
                    <IconBox>
                      <ResponseTimeIcon />
                    </IconBox>
                    <Typography component="h2">Response Times</Typography>
                  </Stack>
                  <MonitorDetailsAreaChart
                    checks={[...monitor.checks].reverse()}
                  />
                </ChartBox>
                <ChartBox
                  gap={theme.spacing(8)}
                  sx={{
                    flex: "100%",
                    height: "fit-content",
                    "& nav": { mt: theme.spacing(12) },
                  }}
                >
                  <Stack mb={theme.spacing(8)}>
                    <IconBox>
                      <HistoryIcon />
                    </IconBox>
                    <Typography
                      component="h2"
                      color={theme.palette.text.secondary}
                    >
                      History
                    </Typography>
                  </Stack>
                  <PaginationTable
                    monitorId={monitorId}
                    dateRange={dateRange}
                  />
                </ChartBox>
              </Stack>
            </Box>
          </Stack>
        </>
      )}
    </Box>
  );
};

DetailsPage.propTypes = {
  isAdmin: PropTypes.bool,
};
export default DetailsPage;

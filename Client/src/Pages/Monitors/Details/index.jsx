import React, { useEffect, useState, useCallback } from "react";
import PropTypes from "prop-types";
import { Box, Skeleton, Stack, Typography, useTheme } from "@mui/material";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../../Utils/axiosConfig";
import MonitorDetailsAreaChart from "../../../Components/Charts/MonitorDetailsAreaChart";
import ButtonGroup from "@mui/material/ButtonGroup";
import Button from "../../../Components/Button";
import WestRoundedIcon from "@mui/icons-material/WestRounded";
import GreenCheck from "../../../assets/icons/checkbox-green.svg?react";
import RedCheck from "../../../assets/icons/checkbox-red.svg?react";
import SettingsIcon from "../../../assets/icons/settings-bold.svg?react";
import PaginationTable from "./PaginationTable";
import {
  formatDuration,
  formatDurationRounded,
} from "../../../Utils/timeUtils";
import "./index.css";

const StatBox = ({ title, value }) => {
  return (
    <Box className="stat-box">
      <Typography variant="h6" sx={{ fontWeight: 400 }}>
        {title}
      </Typography>
      <Typography variant="h4">{value}</Typography>
    </Box>
  );
};

StatBox.propTypes = {
  title: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

/**
 * Renders a skeleton layout.
 *
 * @returns {JSX.Element}
 */
const SkeletonLayout = () => {
  const theme = useTheme();

  return (
    <>
      <Skeleton variant="rounded" width="20%" height={34} />
      <Stack gap={theme.gap.xl} mt={theme.gap.medium}>
        <Stack direction="row" gap={theme.gap.small} mt={theme.gap.small}>
          <Skeleton
            variant="circular"
            style={{ minWidth: 24, minHeight: 24 }}
          />
          <Box width="80%">
            <Skeleton variant="rounded" width="50%" height={24} />
            <Skeleton
              variant="rounded"
              width="50%"
              height={18}
              sx={{ mt: theme.gap.small }}
            />
          </Box>
          <Skeleton
            variant="rounded"
            width="20%"
            height={34}
            sx={{ alignSelf: "flex-end" }}
          />
        </Stack>
        <Stack
          direction="row"
          justifyContent="space-between"
          gap={theme.gap.large}
        >
          <Skeleton variant="rounded" width="100%" height={80} />
          <Skeleton variant="rounded" width="100%" height={80} />
          <Skeleton variant="rounded" width="100%" height={80} />
        </Stack>
        <Box>
          <Stack
            direction="row"
            justifyContent="space-between"
            mb={theme.gap.ml}
          >
            <Skeleton
              variant="rounded"
              width="20%"
              height={24}
              sx={{ alignSelf: "flex-end" }}
            />
            <Skeleton variant="rounded" width="20%" height={34} />
          </Stack>
          <Box sx={{ height: "200px" }}>
            <Skeleton variant="rounded" width="100%" height="100%" />
          </Box>
        </Box>
        <Stack gap={theme.gap.ml}>
          <Skeleton variant="rounded" width="20%" height={24} />
          <Skeleton variant="rounded" width="100%" height={200} />
          <Skeleton variant="rounded" width="100%" height={50} />
        </Stack>
      </Stack>
    </>
  );
};

/**
 * Details page component displaying monitor details and related information.
 * @component
 */
const DetailsPage = () => {
  const [monitor, setMonitor] = useState({});
  const { monitorId } = useParams();
  const { authToken } = useSelector((state) => state.auth);
  const [dateRange, setDateRange] = useState("day");
  const [certificateExpiry, setCertificateExpiry] = useState("N/A");
  const navigate = useNavigate();

  const fetchMonitor = useCallback(async () => {
    try {
      const res = await axiosInstance.get(
        `/monitors/stats/${monitorId}?dateRange=${dateRange}&numToDisplay=50&normalize=true`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      setMonitor(res.data.data);
    } catch (error) {
      console.error("Error fetching monitor of id: " + monitorId);
      navigate("/not-found");
    }
  }, [authToken, monitorId, navigate, dateRange]);

  useEffect(() => {
    fetchMonitor();
  }, [fetchMonitor]);

  useEffect(() => {
    const fetchCertificate = async () => {
      const res = await axiosInstance.get(
        `/monitors/certificate/${monitorId}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      setCertificateExpiry(res.data.data.certificateDate);
    };
    fetchCertificate();
  }, [authToken, monitorId]);

  const theme = useTheme();
  let loading = Object.keys(monitor).length === 0;
  return (
    <Box className="monitor-details">
      {loading ? (
        <SkeletonLayout />
      ) : (
        <>
          <Button
            level="tertiary"
            label="Back to Monitors"
            animate="slideLeft"
            img={<WestRoundedIcon />}
            onClick={() => navigate("/monitors")}
            sx={{
              backgroundColor: "#f4f4f4",
              px: theme.gap.ml,
              "& svg.MuiSvgIcon-root": {
                mr: theme.gap.small,
                fill: theme.palette.otherColors.slateGray,
              },
            }}
          />
          <Stack gap={theme.gap.xl} mt={theme.gap.medium}>
            <Stack direction="row" gap={theme.gap.small} mt={theme.gap.small}>
              {monitor?.status ? <GreenCheck /> : <RedCheck />}
              <Box>
                <Typography component="h1" sx={{ lineHeight: 1 }}>
                  {monitor.url?.replace(/^https?:\/\//, "") || "..."}
                </Typography>
                <Typography mt={theme.gap.small}>
                  <Typography
                    component="span"
                    sx={{
                      color: monitor?.status
                        ? "var(--env-var-color-17)"
                        : "var(--env-var-color-24)",
                    }}
                  >
                    Your site is {monitor?.status ? "up" : "down"}.
                  </Typography>{" "}
                  Checking every {formatDurationRounded(monitor?.interval)}.
                  Last time checked{" "}
                  {formatDurationRounded(monitor?.lastChecked)} ago.
                </Typography>
              </Box>
              <Button
                level="tertiary"
                label="Configure"
                animate="rotate90"
                img={
                  <SettingsIcon
                    style={{
                      minWidth: theme.gap.mlplus,
                      minHeight: theme.gap.mlplus,
                    }}
                  />
                }
                onClick={() => navigate(`/monitors/configure/${monitorId}`)}
                sx={{
                  ml: "auto",
                  alignSelf: "flex-end",
                  backgroundColor: "#f4f4f4",
                  px: theme.gap.medium,
                  "& svg": {
                    mr: "6px",
                  },
                }}
              />
            </Stack>
            <Stack
              direction="row"
              justifyContent="space-between"
              gap={theme.gap.large}
            >
              <StatBox
                title="Currently up for"
                value={formatDuration(monitor?.uptimeDuration)}
              />
              <StatBox
                title="Last checked"
                value={`${formatDuration(monitor?.lastChecked)} ago`}
              />
              <StatBox title="Incidents" value={monitor?.incidents} />
              <StatBox title="Certificate Expiry" value={certificateExpiry} />
            </Stack>
            <Stack
              direction="row"
              justifyContent="space-between"
              gap={theme.gap.large}
            >
              <StatBox
                title="Latest response time"
                value={monitor?.latestResponseTime}
              />
              <StatBox
                title="Average Repsonse Time (24 hours)"
                value={parseFloat(monitor?.avgResponseTime24hours)
                  .toFixed(2)
                  .replace(/\.?0+$/, "")}
              />
              <StatBox
                title="Uptime (24 hours)"
                value={`${parseFloat(monitor?.uptime24Hours)
                  .toFixed(2)
                  .replace(/\.?0+$/, "")}%`}
              />
              <StatBox
                title="Uptime(30 days)"
                value={`${parseFloat(monitor?.uptime30Days)
                  .toFixed(2)
                  .replace(/\.?0+$/, "")}%`}
              />
            </Stack>
            <Box>
              <Stack
                direction="row"
                justifyContent="space-between"
                mb={theme.gap.ml}
              >
                <Typography component="h2" mb={theme.gap.small}>
                  Response Times
                </Typography>
                <ButtonGroup>
                  <Button
                    level="secondary"
                    label="Day"
                    onClick={() => setDateRange("day")}
                    sx={{
                      backgroundColor:
                        dateRange === "day" &&
                        theme.palette.otherColors.fillGray,
                    }}
                  />
                  <Button
                    level="secondary"
                    label="Week"
                    onClick={() => setDateRange("week")}
                    sx={{
                      backgroundColor:
                        dateRange === "week" &&
                        theme.palette.otherColors.fillGray,
                    }}
                  />
                  <Button
                    level="secondary"
                    label="Month"
                    onClick={() => setDateRange("month")}
                    sx={{
                      backgroundColor:
                        dateRange === "month" &&
                        theme.palette.otherColors.fillGray,
                    }}
                  />
                </ButtonGroup>
              </Stack>
              <Box sx={{ height: "200px" }}>
                <MonitorDetailsAreaChart
                  checks={[...monitor.checks].reverse()}
                />
              </Box>
            </Box>
            <Stack gap={theme.gap.ml}>
              <Typography component="h2">History</Typography>
              {/* TODO New Table */}
              <PaginationTable monitorId={monitorId} dateRange={dateRange} />
              {/* <BasicTable data={data} paginated={true} /> */}
            </Stack>
          </Stack>
        </>
      )}
    </Box>
  );
};

export default DetailsPage;

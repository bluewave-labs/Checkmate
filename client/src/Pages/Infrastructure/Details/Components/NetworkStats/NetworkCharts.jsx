// NetworkCharts.jsx
import { Grid, Card, CardContent, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import AreaChart from "../../../../../Components/Charts/AreaChart";
import { TzTick, InfrastructureTooltip } from '../../../../../Components/Charts/Utils/chartUtils';

const BytesTick = ({ x, y, payload }) => {
  const value = payload.value;
  const label =
    value >= 1024 ** 3
      ? `${(value / 1024 ** 3).toFixed(2)} GB`
      : value >= 1024 ** 2
      ? `${(value / 1024 ** 2).toFixed(2)} MB`
      : `${(value / 1024).toFixed(2)} KB`;

  return <text x={x} y={y} textAnchor="end" fill="#888">{label}</text>;
};

const getFormattedNetworkMetric = (value) => {
    if (typeof value !== "number" || isNaN(value)) return "0";
        if (value >= 1024 ** 3) return `${(value / 1024 ** 3).toFixed(1)} GB/s`;
        if (value >= 1024 ** 2) return `${(value / 1024 ** 2).toFixed(1)} MB/s`;
        if (value >= 1024) return `${(value / 1024).toFixed(1)} KB/s`;
        return `${Math.round(value)} B/s`;
};

const NetworkCharts = ({ eth0Data, dateRange }) => {
  const theme = useTheme();
  const textColor = theme.palette.primary.contrastTextTertiary;

  const charts = [
    { title: "Bytes per second", key: "bytesPerSec", color: theme.palette.info.main, yTick: <BytesTick /> },
    { title: "Packets per second", key: "packetsPerSec", color: theme.palette.success.main },
    { title: "Errors", key: "errors", color: theme.palette.error.main },
    { title: "Drops", key: "drops", color: theme.palette.warning.main }
  ];

  const formatYAxis = (key, value) => {
    if (key === "bytesPerSec") {
      // Format as MB/s or GB/s if large
      if (value >= 1024 ** 3) return `${(value / 1024 ** 3).toFixed(1)} GB/s`;
      if (value >= 1024 ** 2) return `${(value / 1024 ** 2).toFixed(1)} MB/s`;
      if (value >= 1024) return `${(value / 1024).toFixed(1)} KB/s`;
      return `${Math.round(value)} B/s`;
    }
    return Math.round(value).toLocaleString();
  };

  const CustomTick = ({ x, y, payload, chartKey }) => {
    // Ensure value is always rounded for display
    let value = payload.value;
    if (typeof value === 'number') {
      value = Math.round(value);
    }
    return (
      <text x={x} y={y} textAnchor="end" fill="#888">
        {formatYAxis(chartKey, value)}
      </text>
    );
  };

  const chartConfigs = charts.map((chart) => ({
    data: eth0Data,
    dataKeys: [chart.key],
    heading: chart.title,
    strokeColor: chart.color,
    gradientStartColor: chart.color,
    yTick: chart.yTick || <CustomTick chartKey={chart.key} />,
    xTick: <TzTick dateRange={dateRange} />,
    toolTip: (
      <InfrastructureTooltip
        dotColor={chart.color}
        yKey={chart.key}
        yLabel={chart.title}
        dateRange={dateRange}
        formatter={getFormattedNetworkMetric}
      />
    ),
  }));

  return (
    <Grid container spacing={3}>
      {chartConfigs.map((config, idx) => (
        <Grid item xs={12} md={6} key={config.heading}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" sx={{ color: textColor }} mb={2}>
                {config.heading}
              </Typography>
              <AreaChart
                data={config.data}
                dataKeys={config.dataKeys}
                xKey="time"
                yTick={config.yTick}
                xTick={config.xTick}
                strokeColor={config.strokeColor}
                gradient
                gradientStartColor={config.gradientStartColor}
                gradientEndColor="#fff"
                height={200}
                customTooltip={config.toolTip}
              />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default NetworkCharts;
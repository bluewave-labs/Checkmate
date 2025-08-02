// NetworkCharts.jsx
import { Grid, Card, CardContent, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import AreaChart from "../../../../../Components/Charts/AreaChart";
import { TzTick } from '../../../../../Components/Charts/Utils/chartUtils';

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

const NetworkCharts = ({ eth0Data, dateRange }) => {
  const theme = useTheme();
  const textColor = theme.palette.primary.contrastTextTertiary;

  const charts = [
    { title: "eth0 Bytes/sec", key: "bytesPerSec", color: theme.palette.info.main, yTick: <BytesTick /> },
    { title: "eth0 Packets/sec", key: "packetsPerSec", color: theme.palette.success.main },
    { title: "eth0 Errors", key: "errors", color: theme.palette.error.main },
    { title: "eth0 Drops", key: "drops", color: theme.palette.warning.main }
  ];

  return (
    <Grid container spacing={3}>
      {charts.map((chart) => (
        <Grid item xs={12} md={6} key={chart.key}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" sx={{ color: textColor }} mb={2}>
                {chart.title}
              </Typography>
              <AreaChart
                data={eth0Data}
                dataKeys={[chart.key]}
                xKey="time"
                yTick={chart.yTick || null}
                xTick={<TzTick dateRange={dateRange} />}
                strokeColor={chart.color}
                gradient
                gradientStartColor={chart.color}
                gradientEndColor="#fff"
                height={200}
              />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default NetworkCharts;
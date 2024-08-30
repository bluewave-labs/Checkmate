import { BarChart, Bar, Cell, ReferenceLine, Label } from "recharts";

import PropTypes from "prop-types";
import { useTheme } from "@emotion/react";

const MonitorDetails60MinChart = ({ data }) => {
  const theme = useTheme();

  const labelStyle = {
    fontSize: "10px",
    fill: theme.palette.text.tertiary,
  };

  const color = {
    true: theme.palette.success.main,
    false: theme.palette.error.text,
    undefined: theme.palette.unresolved.main,
  };
  return (
    <BarChart
      width={data.length * 10 + 30}
      height={35}
      data={data}
      margin={{ top: 14, left: 15, right: 15, bottom: 2 }}
      style={{ alignSelf: "baseline" }}
    >
      <Bar dataKey="value" barSize={10}>
        {data.map((check, index) => (
          <Cell key={`cell-${index}`} fill={color[check.status]} />
        ))}
      </Bar>
      <ReferenceLine x={0} stroke="black" strokeDasharray="3 3">
        <Label value="60 mins" position="top" style={labelStyle} />
      </ReferenceLine>
      <ReferenceLine
        x={Math.floor(data.length * (2 / 3))}
        stroke="black"
        strokeDasharray="3 3"
      >
        <Label value="20 mins" position="top" style={labelStyle} />
      </ReferenceLine>
      <ReferenceLine x={data.length - 1} stroke="black" strokeDasharray="3 3">
        <Label value="now" position="top" style={labelStyle} />
      </ReferenceLine>
    </BarChart>
  );
};

MonitorDetails60MinChart.propTypes = {
  data: PropTypes.array.isRequired,
};

export default MonitorDetails60MinChart;

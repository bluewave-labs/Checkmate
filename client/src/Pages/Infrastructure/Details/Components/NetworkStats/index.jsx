import NetworkStatBoxes from "./NetworkStatBoxes";
import NetworkCharts from "./NetworkCharts";
import MonitorTimeFrameHeader from "../../../../../Components/MonitorTimeFrameHeader";

function filterByDateRange(data, dateRange) {
  if (!Array.isArray(data)) return [];
  const now = Date.now();
  let cutoff;
  switch (dateRange) {
    case "recent":
      cutoff = now - 2 * 60 * 60 * 1000; // last 2 hours
      break;
    case "day":
      cutoff = now - 24 * 60 * 60 * 1000; // last 24 hours
      break;
    case "week":
      cutoff = now - 7 * 24 * 60 * 60 * 1000; // last 7 days
      break;
    case "month":
      cutoff = now - 30 * 24 * 60 * 60 * 1000; // last 30 days
      break;
    default:
      cutoff = 0;
  }
  return data.filter((d) => new Date(d.time).getTime() >= cutoff);
}

const Network = ({ net, checks, isLoading, dateRange, setDateRange }) => {
  const eth0Data = getEth0TimeSeries(checks);
  const xAxisFormatter = getXAxisFormatter(checks);
  const filteredEth0Data = filterByDateRange(eth0Data, dateRange);

  return (
    <>
      <NetworkStatBoxes shouldRender={!isLoading} net={net} />
      <MonitorTimeFrameHeader
        isLoading={isLoading}
        dateRange={dateRange}
        setDateRange={setDateRange}
      />
      <NetworkCharts eth0Data={filteredEth0Data} xAxisFormatter={xAxisFormatter} />
    </>
  );
};

export default Network;

/* ---------- Helper functions ---------- */
function getEth0TimeSeries(checks) {
  const sorted = [...(checks || [])].sort((a, b) => new Date(a._id) - new Date(b._id));
  const series = [];
  let prev = null;

  for (const check of sorted) {
    const eth = (check.net || []).find((iface) => iface.name === "en0");
    if (!eth) {
      prev = check;
      continue;
    }
    if (prev) {
      const prevEth = (prev.net || []).find((iface) => iface.name === "en0");
      const t1 = new Date(check._id);
      const t0 = new Date(prev._id);
      if (!prevEth || isNaN(t1) || isNaN(t0)) {
        prev = check;
        continue;
      }
      const dt = (t1 - t0) / 1000;
      if (dt > 0) {
        series.push({
          time: check._id,
          bytesPerSec: (eth.bytesSent - prevEth.bytesSent) / dt,
          packetsPerSec: (eth.packetsSent - prevEth.packetsSent) / dt,
          errors: (eth.errIn ?? 0) + (eth.errOut ?? 0),
          drops: (eth.dropIn ?? 0) + (eth.dropOut ?? 0),
        });
      }
    }
    prev = check;
  }

  return series;
}

function getXAxisFormatter(checks) {
  if (!checks || checks.length === 0) return (val) => val;
  const sorted = [...checks].sort((a, b) => new Date(a._id) - new Date(b._id));
  const first = new Date(sorted[0]._id);
  const last = new Date(sorted[sorted.length - 1]._id);
  const diffDays = (last - first) / (1000 * 60 * 60 * 24);

  return diffDays > 2
    ? (val) => new Date(val).toLocaleDateString(undefined, { month: "short", day: "numeric" })
    : (val) =>
        new Date(val).toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
}

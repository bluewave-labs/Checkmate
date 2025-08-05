import PropTypes from "prop-types";
import NetworkStatBoxes from "./NetworkStatBoxes";
import NetworkCharts from "./NetworkCharts";
import MonitorTimeFrameHeader from "../../../../../Components/MonitorTimeFrameHeader";

const Network = ({ net, checks, isLoading, dateRange, setDateRange }) => {
	const eth0Data = getEth0TimeSeries(checks);

	return (
		<>
			<NetworkStatBoxes
				shouldRender={!isLoading}
				net={net}
			/>
			<MonitorTimeFrameHeader
				isLoading={isLoading}
				dateRange={dateRange}
				setDateRange={setDateRange}
			/>
			<NetworkCharts
				eth0Data={eth0Data}
				dateRange={dateRange}
			/>
		</>
	);
};

Network.propTypes = {
	net: PropTypes.array,
	checks: PropTypes.array,
	isLoading: PropTypes.bool.isRequired,
	dateRange: PropTypes.string.isRequired,
	setDateRange: PropTypes.func.isRequired,
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
				const bytesField = eth.avgBytesSent;
				const prevBytesField = prevEth.avgBytesSent;

				if (bytesField !== undefined && prevBytesField !== undefined) {
					const dataPoint = {
						_id: check._id,
						bytesPerSec: (bytesField - prevBytesField) / dt,
						packetsPerSec: (eth.avgPacketsSent - prevEth.avgPacketsSent) / dt,
						errors: (eth.avgErrIn ?? 0) + (eth.avgErrOut ?? 0),
						drops: 0,
					};
					series.push(dataPoint);
				}
			}
		}
		prev = check;
	}

	// If we only have one check, create a single data point with absolute values
	if (series.length === 0 && sorted.length === 1) {
		const check = sorted[0];
		const eth = (check.net || []).find((iface) => iface.name === "en0");
		if (eth) {
			series.push({
				_id: check._id,
				bytesPerSec: eth.avgBytesSent || 0,
				packetsPerSec: eth.avgPacketsSent || 0,
				errors: (eth.avgErrIn ?? 0) + (eth.avgErrOut ?? 0),
				drops: 0,
			});
		}
	}

	return series;
}

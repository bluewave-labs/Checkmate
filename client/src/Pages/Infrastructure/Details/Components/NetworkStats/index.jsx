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
	console.log(`[NetworkStats] Processing ${checks?.length || 0} checks`);
	if (checks && checks.length > 0) {
		console.log("[NetworkStats] First check _id:", checks[0]._id);
		console.log("[NetworkStats] Last check _id:", checks[checks.length - 1]._id);
		console.log(
			"[NetworkStats] Sample check structure:",
			JSON.stringify(checks[0], null, 2)
		);
	}

	const sorted = [...(checks || [])].sort((a, b) => new Date(a._id) - new Date(b._id));
	const series = [];
	let prev = null;

	for (const check of sorted) {
		console.log(`[NetworkStats] Processing check: ${check._id}`);
		const eth = (check.net || []).find((iface) => iface.name === "en0");
		if (!eth) {
			console.log("[NetworkStats] No en0 interface found in check:", check._id);
			prev = check;
			continue;
		}

		console.log(`[NetworkStats] Found en0 interface in check ${check._id}:`, eth);

		if (prev) {
			console.log(`[NetworkStats] Have previous check: ${prev._id}`);
			const prevEth = (prev.net || []).find((iface) => iface.name === "en0");
			const t1 = new Date(check._id);
			const t0 = new Date(prev._id);
			console.log(`[NetworkStats] Time difference: ${t1 - t0}ms`);

			if (!prevEth || isNaN(t1) || isNaN(t0)) {
				console.log("[NetworkStats] Skipping - invalid prev data or time");
				prev = check;
				continue;
			}

			const dt = (t1 - t0) / 1000;
			console.log(`[NetworkStats] Delta time: ${dt}s`);

			if (dt > 0) {
				const bytesField = eth.avgBytesSent;
				const prevBytesField = prevEth.avgBytesSent;

				console.log(`[NetworkStats] Bytes comparison:`, {
					current: bytesField,
					previous: prevBytesField,
					diff: bytesField - prevBytesField,
				});

				if (bytesField !== undefined && prevBytesField !== undefined) {
					const dataPoint = {
						_id: check._id, // Use _id instead of time to match AreaChartBoxes
						bytesPerSec: (bytesField - prevBytesField) / dt,
						packetsPerSec: (eth.avgPacketsSent - prevEth.avgPacketsSent) / dt,
						errors: (eth.avgErrIn ?? 0) + (eth.avgErrOut ?? 0),
						drops: 0, // Skip drops for now since we don't have avgDropIn/Out
					};
					console.log(`[NetworkStats] Adding data point:`, dataPoint);
					series.push(dataPoint);
				} else {
					console.warn("[NetworkStats] Missing bytes fields:", { eth, prevEth });
				}
			} else {
				console.log("[NetworkStats] Skipping - zero or negative time delta");
			}
		} else {
			console.log("[NetworkStats] No previous check yet, setting as prev");
		}
		prev = check;
	}

	console.log(`[NetworkStats] Generated ${series.length} time series data points`);

	// If we only have one check, create a single data point with absolute values
	if (series.length === 0 && sorted.length === 1) {
		const check = sorted[0];
		const eth = (check.net || []).find((iface) => iface.name === "en0");
		if (eth) {
			console.log(
				"[NetworkStats] Only one data point available, showing absolute values"
			);
			series.push({
				_id: check._id, // Use _id instead of time to match AreaChartBoxes
				bytesPerSec: eth.avgBytesSent || 0, // Show absolute value instead of rate
				packetsPerSec: eth.avgPacketsSent || 0, // Show absolute value instead of rate
				errors: (eth.avgErrIn ?? 0) + (eth.avgErrOut ?? 0),
				drops: 0,
			});
		}
	}

	if (series.length > 0) {
		console.log("[NetworkStats] Sample series data:", series[0]);
	}
	return series;
}

import PropTypes from "prop-types";
import NetworkStatBoxes from "./NetworkStatBoxes";
import NetworkCharts from "./NetworkCharts";
import MonitorTimeFrameHeader from "../../../../../Components/MonitorTimeFrameHeader";

const Network = ({ net, checks, isLoading, dateRange, setDateRange }) => {
	const eth0Data = (checks || [])
		.map((check) => {
			const en0 = (check.net || []).find((iface) => iface.name === "en0");
			if (!en0) return null;

			return {
				_id: check._id,                 
				bytesPerSec: en0.avgBytesRecv,
				packetsPerSec: en0.avgPacketsRecv,
				errors: (en0.avgErrOut ?? 0),
				drops: (en0.avgDropOut ?? 0)
			};
		})
		.filter(Boolean);

	console.log(eth0Data);

	return (
		<>
			<NetworkStatBoxes shouldRender={!isLoading} net={net} />
			<MonitorTimeFrameHeader
				isLoading={isLoading}
				dateRange={dateRange}
				setDateRange={setDateRange}
			/>
			<NetworkCharts eth0Data={eth0Data} dateRange={dateRange} />
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

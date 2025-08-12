import PropTypes from "prop-types";
import NetworkStatBoxes from "./NetworkStatBoxes";
import NetworkCharts from "./NetworkCharts";
import MonitorTimeFrameHeader from "../../../../../Components/MonitorTimeFrameHeader";

const getNetworkInterfaceData = (checks) => {
	const interfaceNames = ["eth0", "Ethernet", "en0"];

	return (checks || [])
		.map((check) => {
			const networkInterface = (check.net || []).find((iface) =>
				interfaceNames.includes(iface.name)
			);

			if (!networkInterface) {
				return null;
			}

			return {
				_id: check._id,
				bytesPerSec: networkInterface.avgBytesRecv,
				packetsPerSec: networkInterface.avgPacketsRecv,
				errors: networkInterface.avgErrOut ?? 0,
				drops: networkInterface.avgDropOut ?? 0,
			};
		})
		.filter(Boolean);
};

const Network = ({ net, checks, isLoading, dateRange, setDateRange }) => {
	const eth0Data = getNetworkInterfaceData(checks);
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

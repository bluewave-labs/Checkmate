import PropTypes from "prop-types";
import NetworkStatBoxes from "./NetworkStatBoxes";
import NetworkCharts from "./NetworkCharts";
import MonitorTimeFrameHeader from "../../../../../Components/MonitorTimeFrameHeader";

const getInterfaceName = (net) => {
	const interfaceNames = ["eth0", "Ethernet", "en0"];
	const found = (net || []).find((iface) => interfaceNames.includes(iface.name));
	return found ? found.name : null;
};

const getNetworkInterfaceData = (checks, ifaceName) => {
	return (checks || [])
		.map((check) => {
			const networkInterface = (check.net || []).find(
				(iface) => iface.name === ifaceName
			);
			if (!networkInterface) return null;
			return {
				_id: check._id,
				bytesPerSec: networkInterface.deltaBytesRecv,
				packetsPerSec: networkInterface.deltaPacketsRecv,
				errors: networkInterface.deltaErrOut ?? 0,
				drops: networkInterface.deltaDropOut ?? 0,
			};
		})
		.filter(Boolean);
};

const Network = ({ net, checks, isLoading, dateRange, setDateRange }) => {
	const ifaceName = getInterfaceName(net);
	const ethernetData = getNetworkInterfaceData(checks, ifaceName);

	return (
		<>
			<NetworkStatBoxes
				shouldRender={!isLoading}
				net={net}
				ifaceName={ifaceName}
			/>
			<MonitorTimeFrameHeader
				isLoading={isLoading}
				dateRange={dateRange}
				setDateRange={setDateRange}
			/>
			<NetworkCharts
				ethernetData={ethernetData}
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

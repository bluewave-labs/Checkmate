import PropTypes from "prop-types";
import { useState, useEffect } from "react";
import { Box } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useTheme } from "@emotion/react";
import Select from "../../../../../Components/Inputs/Select";
import NetworkStatBoxes from "./NetworkStatBoxes";
import NetworkCharts from "./NetworkCharts";
import MonitorTimeFrameHeader from "../../../../../Components/MonitorTimeFrameHeader";

const getAvailableInterfaces = (net) => {
	return (net || []).map((iface) => iface.name).filter(Boolean);
};

const getNetworkInterfaceData = (checks, ifaceName) => {
	if (!ifaceName) return [];

	// Transform backend data structure for the selected interface
	// Backend already calculates deltas, we just reshape the data
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
	const { t } = useTranslation();
	const theme = useTheme();

	const availableInterfaces = getAvailableInterfaces(net);
	const [selectedInterface, setSelectedInterface] = useState("");

	// Set default interface when data loads
	useEffect(() => {
		if (availableInterfaces.length > 0 && !selectedInterface) {
			setSelectedInterface(availableInterfaces[0]);
		}
	}, [availableInterfaces, selectedInterface]);

	const ethernetData = getNetworkInterfaceData(checks, selectedInterface);

	return (
		<>
			<NetworkStatBoxes
				shouldRender={!isLoading}
				net={net}
				ifaceName={selectedInterface}
			/>
			<Box
				display="flex"
				justifyContent="space-between"
				alignItems="flex-end"
				gap={theme.spacing(4)}
			>
				{availableInterfaces.length > 0 && (
					<Select
						name="networkInterface"
						label={t("networkInterface")}
						value={selectedInterface}
						onChange={(e) => setSelectedInterface(e.target.value)}
						items={availableInterfaces.map((interfaceName) => ({
							_id: interfaceName,
							name: interfaceName
						}))}
						sx={{ minWidth: 200 }}
					/>
				)}
				<MonitorTimeFrameHeader
					isLoading={isLoading}
					dateRange={dateRange}
					setDateRange={setDateRange}
				/>
			</Box>
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

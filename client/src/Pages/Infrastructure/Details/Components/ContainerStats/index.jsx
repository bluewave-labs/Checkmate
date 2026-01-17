import PropTypes from "prop-types";
import { useState, useEffect } from "react";
import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useTheme } from "@emotion/react";
import Select from "@/Components/v1/Inputs/Select/index.jsx";
import ContainerStatBoxes from "./ContainerStatBoxes.jsx";
import ContainerCharts from "./ContainerCharts.jsx";
import MonitorTimeFrameHeader from "@/Components/v1/MonitorTimeFrameHeader/index.jsx";

const getAvailableContainers = (containers) => {
	return (containers || [])
		.filter((c) => c.vmid && c.name)
		.map((c) => ({
			vmid: String(c.vmid),
			name: c.name,
			node: c.node,
			status: c.status,
			type: c.type,
		}));
};

const getContainerData = (checks, vmid) => {
	if (!vmid) return [];

	return (checks || [])
		.map((check) => {
			const container = (check.containers || []).find(
				(c) => String(c.vmid) === String(vmid)
			);
			if (!container) return null;
			return {
				_id: check._id,
				cpuUsage: container.avgCpuUsage ?? 0,
				memoryUsage: container.avgMemoryUsage ?? 0,
				diskRead: container.deltaDiskRead ?? 0,
				diskWrite: container.deltaDiskWrite ?? 0,
				netIn: container.deltaNetIn ?? 0,
				netOut: container.deltaNetOut ?? 0,
			};
		})
		.filter(Boolean);
};

const ContainerStats = ({ containers, checks, isLoading, dateRange, setDateRange }) => {
	const { t } = useTranslation();
	const theme = useTheme();

	const availableContainers = getAvailableContainers(containers);
	const [selectedContainer, setSelectedContainer] = useState("");

	useEffect(() => {
		if (availableContainers.length > 0 && !selectedContainer) {
			setSelectedContainer(availableContainers[0].vmid);
		}
	}, [availableContainers, selectedContainer]);

	const containerData = getContainerData(checks, selectedContainer);
	const currentContainer = containers?.find(
		(c) => String(c.vmid) === String(selectedContainer)
	);

	if (!containers?.length) {
		return (
			<Box
				display="flex"
				justifyContent="center"
				alignItems="center"
				minHeight={200}
			>
				<Typography color={theme.palette.primary.contrastTextTertiary}>
					{t("noContainersAvailable")}
				</Typography>
			</Box>
		);
	}

	return (
		<>
			<ContainerStatBoxes
				shouldRender={!isLoading}
				container={currentContainer}
			/>
			<Box
				display="flex"
				justifyContent="space-between"
				alignItems="flex-end"
				gap={theme.spacing(4)}
			>
				{availableContainers.length > 0 && (
					<Select
						name="container"
						label={t("container")}
						value={selectedContainer}
						onChange={(e) => setSelectedContainer(e.target.value)}
						items={availableContainers.map((c) => ({
							_id: c.vmid,
							name: `${c.name} (${c.vmid}) - ${c.node}`,
						}))}
						sx={{ minWidth: 250 }}
					/>
				)}
				<MonitorTimeFrameHeader
					isLoading={isLoading}
					dateRange={dateRange}
					setDateRange={setDateRange}
				/>
			</Box>
			<ContainerCharts
				containerData={containerData}
				dateRange={dateRange}
			/>
		</>
	);
};

ContainerStats.propTypes = {
	containers: PropTypes.array,
	checks: PropTypes.array,
	isLoading: PropTypes.bool.isRequired,
	dateRange: PropTypes.string.isRequired,
	setDateRange: PropTypes.func.isRequired,
};

export default ContainerStats;

import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Table } from "@/Components/v2/DesignElements";
import { HistogramResponseTime } from "@/Components/v2/Monitors/HistogramResponseTime";
import type { Header } from "@/Components/v2/DesignElements/Table";
import { ActionsMenu } from "@/Components/v2/ActionsMenu";
import { StatusLabel } from "@/Components/v2/DesignElements";

import { useTranslation } from "react-i18next";
import { useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { usePatch } from "@/Hooks/v2/UseApi";
import type { ApiResponse } from "@/Hooks/v2/UseApi";

import type { IMonitor } from "@/Types/Monitor";
import type { ActionMenuItem } from "@/Components/v2/ActionsMenu";

export const MonitorTable = ({
	monitors,
	refetch,
}: {
	monitors: IMonitor[];
	refetch: Function;
}) => {
	const { t } = useTranslation();
	const theme = useTheme();
	const isSmall = useMediaQuery(theme.breakpoints.down("md"));
	const navigate = useNavigate();
	const {
		patch,
		// loading: isPatching,
		// error: postError,
	} = usePatch<ApiResponse>();

	const getActions = (monitor: IMonitor): ActionMenuItem[] => {
		return [
			{
				id: 1,
				label: "Open site",
				action: () => {
					window.open(monitor.url, "_blank", "noreferrer");
				},
				closeMenu: true,
			},
			{
				id: 2,
				label: "Details",
				action: () => {
					navigate(`${monitor._id}`);
				},
			},
			{
				id: 3,
				label: "Incidents",
				action: () => {
					navigate(`/v2/incidents/${monitor._id}`);
				},
			},
			{
				id: 4,
				label: "Configure",
				action: () => {
					console.log("Open configure");
				},
			},
			{
				id: 5,
				label: "Clone",
				action: () => {
					console.log("Open clone");
				},
			},
			{
				id: 6,
				label: monitor.isActive ? "Pause" : "Resume",
				action: async () => {
					await patch(`/monitors/${monitor._id}/active`);
					refetch();
				},
				closeMenu: true,
			},
			{
				id: 7,
				label: <Typography color={theme.palette.error.main}>Remove</Typography>,
				action: () => {
					console.log("Open delete");
				},
				closeMenu: true,
			},
		];
	};

	const getHeaders = () => {
		const headers: Header<IMonitor>[] = [
			{
				id: "name",
				content: t("host"),
				render: (row) => {
					return row.name;
				},
			},
			{
				id: "status",
				content: t("status"),
				render: (row) => {
					return <StatusLabel status={row.status} />;
				},
			},
			{
				id: "histogram",
				content: t("responseTime"),
				render: (row) => {
					return (
						<Stack alignItems={"center"}>
							<HistogramResponseTime checks={row.latestChecks} />
						</Stack>
					);
				},
			},
			{
				id: "type",
				content: t("type"),
				render: (row) => {
					return row.type;
				},
			},
			{
				id: "actions",
				content: t("actions"),
				render: (row) => {
					return <ActionsMenu items={getActions(row)} />;
				},
			},
		];
		return headers;
	};

	let headers = getHeaders();

	if (isSmall) {
		headers = headers.filter((h) => h.id !== "histogram");
	}
	return (
		<Table
			headers={headers}
			data={monitors}
			onRowClick={(row) => {
				navigate(row._id);
			}}
		/>
	);
};

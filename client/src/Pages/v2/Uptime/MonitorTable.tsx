import Stack from "@mui/material/Stack";
import { HistogramResponseTime } from "@/Components/v2/Monitors/HistogramResponseTime";
import type { Header } from "@/Components/v2/DesignElements/Table";
import type { IMonitor } from "@/Types/Monitor";
import { Table } from "@/Components/v2/DesignElements";
import { useTranslation } from "react-i18next";
import { useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { ActionsMenu } from "@/Components/v2/ActionsMenu";
import type { ActionMenuItem } from "@/Components/v2/ActionsMenu";
import Typography from "@mui/material/Typography";

const getActions = (theme: any, t: Function): ActionMenuItem[] => {
	return [
		{
			id: 1,
			label: "Open site",
			action: () => {
				console.log("Open site");
			},
			closeMenu: true,
		},
		{
			id: 2,
			label: "Details",
			action: () => {
				console.log("Open details");
			},
		},
		{
			id: 3,
			label: "Incidents",
			action: () => {
				console.log("Open incidents");
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
			label: "Pause",
			action: () => {
				console.log("Open pause");
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

const getHeaders = (theme: any, t: Function) => {
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
				return row.status;
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
				return <ActionsMenu items={getActions(theme, t)} />;
			},
		},
	];
	return headers;
};

export const MonitorTable = ({ monitors }: { monitors: IMonitor[] }) => {
	const { t } = useTranslation();
	const theme = useTheme();
	const isSmall = useMediaQuery(theme.breakpoints.down("md"));

	let headers = getHeaders(theme, t);

	if (isSmall) {
		headers = headers.filter((h) => h.id !== "histogram");
	}
	return (
		<Table
			headers={headers}
			data={monitors}
		/>
	);
};

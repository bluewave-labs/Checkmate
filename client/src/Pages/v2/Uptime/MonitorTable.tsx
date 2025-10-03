import Stack from "@mui/material/Stack";
import { HistogramResponseTime } from "@/Components/v2/Monitors/HistogramResponseTime";
import type { Header } from "@/Components/v2/DesignElements/Table";
import type { IMonitor } from "@/Types/Monitor";
import { Table } from "@/Components/v2/DesignElements";
import { useTranslation } from "react-i18next";
import { useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
const getHeaders = (t: Function) => {
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
	];
	return headers;
};

export const MonitorTable = ({ monitors }: { monitors: IMonitor[] }) => {
	const { t } = useTranslation();
	const theme = useTheme();
	const isSmall = useMediaQuery(theme.breakpoints.down("md"));

	let headers = getHeaders(t);

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

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { DockerStateLabel, Table } from "@/Components/design-elements";
// Hooks
import { useTranslation } from "react-i18next";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";

// Types
import type { Header } from "@/Components/design-elements/Table";
import type { DockerContainerInfo } from "@/Types/Check";
import type { DockerContainerAlertState } from "@/Types/Monitor";

// Utils
import { formatPercentage, PLACEHOLDER } from "@/Utils/FormatUtils";

interface DockerContainersTableProps {
	monitorId: string | undefined;
	containers: DockerContainerInfo[];
	alertStates?: DockerContainerAlertState[];
	onRowClick?: (container: DockerContainerInfo) => void;
}

export const DockerContainersTable = ({
	monitorId,
	containers,
	alertStates = [],
}: DockerContainersTableProps) => {
	const { t } = useTranslation();
	const theme = useTheme();
	const isSmall = useMediaQuery(theme.breakpoints.down("md"));
	const navigate = useNavigate();
	const alertStateByName = new Map(alertStates.map((state) => [state.name, state]));
	const needsAttention = (name: string) => {
		const state = alertStateByName.get(name);
		return Boolean(state && (state.alerted || state.health === "unhealthy"));
	};

	const getHeaders = () => {
		// const renderSortIcon = (isActive: boolean) => (
		// 	<Box
		// 		width={16}
		// 		display="inline-flex"
		// 		justifyContent="center"
		// 	>
		// 		{isActive ? (
		// 			sortOrder === "asc" ? (
		// 				<ArrowUp size={16} />
		// 			) : (
		// 				<ArrowDown size={16} />
		// 			)
		// 		) : null}
		// 	</Box>
		// );
		const headers: Header<DockerContainerInfo>[] = [
			{
				id: "container",
				content: t("pages.docker.host.table.headers.container"),
				render: (row) => {
					return (
						<DockerStateLabel
							state={row.state}
							name={row.name}
							image={row.image}
							alerted={needsAttention(row.name)}
						/>
					);
				},
			},
			{
				id: "status",
				content: t("common.table.headers.status"),
				render: (row) => {
					return <Typography>{row.state}</Typography>;
				},
			},
			{
				id: "health",
				content: t("common.labels.health"),
				render: (row) => {
					return <Typography>{row.health}</Typography>;
				},
			},
			{
				id: "cpu",
				content: t("pages.docker.host.table.headers.cpu"),
				render: (row) => {
					return <Typography>{formatPercentage(row.cpuPct ?? 0)}</Typography>;
				},
			},
			{
				id: "memory",
				content: t("pages.docker.host.table.headers.memory"),
				render: (row) => {
					return <Typography>{formatPercentage(row.memoryPct ?? 0)}</Typography>;
				},
			},
			{
				id: "restarts",
				content: t("common.labels.restarts"),
				render: (row) => {
					return <Typography>{row.restartCount ?? PLACEHOLDER}</Typography>;
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
		<Box>
			<Table
				headers={headers}
				data={containers}
				onRowClick={(row) => {
					navigate(`/docker/host/${monitorId}/container/${row.name}`);
				}}
				// getRowSx={(row) => ({
				// 	backgroundColor: isRowSelected(row.id)
				// 		? theme.palette.action.selected
				// 		: "inherit",
				// })}
			/>
		</Box>
	);
};

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

// Utils
import { formatPercentage } from "@/Utils/FormatUtils";

interface DockerContainersTableProps {
	containers: DockerContainerInfo[];
	onRowClick?: (container: DockerContainerInfo) => void;
}

export const DockerContainersTable = ({ containers }: DockerContainersTableProps) => {
	const { t } = useTranslation();
	const theme = useTheme();
	const isSmall = useMediaQuery(theme.breakpoints.down("md"));
	const navigate = useNavigate();

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
				content: "Containers",
				render: (row) => {
					return (
						<DockerStateLabel
							state={row.state}
							name={row.name}
							image={row.image}
						/>
					);
				},
			},
			{
				id: "status",
				content: "Status",
				render: (row) => {
					return <Typography>{row.state}</Typography>;
				},
			},
			{
				id: "health",
				content: "Health",
				render: (row) => {
					return <Typography>{row.health}</Typography>;
				},
			},
			{
				id: "cpu",
				content: "CPU",
				render: (row) => {
					return <Typography>{formatPercentage(row.cpuPct ?? 0)}</Typography>;
				},
			},
			{
				id: "memory",
				content: "Memory",
				render: (row) => {
					return <Typography>{formatPercentage(row.memoryPct ?? 0)}</Typography>;
				},
			},
			{
				id: "restarts",
				content: "Restarts",
				render: (row) => {
					return <Typography>{row.restartCount}</Typography>;
				},
			},
		];
		return headers;
	};

	let headers = getHeaders();

	if (isSmall) {
		headers = headers.filter((h) => h.id !== "histogram");
	}

	console.log(JSON.stringify(containers, null, 2));
	return (
		<Box>
			<Table
				headers={headers}
				data={containers}
				onRowClick={(row) => {
					navigate(`/docker/container/${row.id}`);
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

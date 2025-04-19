// Components
import DataTable from "../../../../../Components/Table";
import BarChart from "../../../../../Components/Charts/BarChart";
import { Box } from "@mui/material";
import { StatusLabel } from "../../../../../Components/Label";
import Host from "../../../../../Components/Host";

// Utils
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { useMonitorUtils } from "../../../../../Hooks/useMonitorUtils";
import PropTypes from "prop-types";

// Constants
const TYPE_MAP = {
	distributed_http: "Distributed HTTP",
};

const MonitorTable = ({ isLoading, monitors }) => {
	const theme = useTheme();
	const navigate = useNavigate();
	const { determineState } = useMonitorUtils();
	const headers = [
		{
			id: "name",
			content: <Box>Host</Box>,
			render: (row) => (
				<Host
					key={row._id}
					url={row.url}
					title={row.name}
					percentageColor={row.percentageColor}
					percentage={row.percentage}
				/>
			),
		},
		{
			id: "status",
			content: <Box width="max-content"> Status</Box>,
			render: (row) => {
				const status = determineState(row?.monitor);
				return (
					<StatusLabel
						status={status}
						text={status}
						customStyles={{ textTransform: "capitalize" }}
					/>
				);
			},
		},
		{
			id: "responseTime",
			content: "Response Time",
			render: (row) => <BarChart checks={row?.monitor?.checks.slice().reverse()} />,
		},
		{
			id: "type",
			content: "Type",
			render: (row) => <span>{TYPE_MAP[row.monitor.type]}</span>,
		},
		{
			id: "actions",
			content: "Actions",
			render: (row) => <span>{"TODO"}</span>,
		},
	];

	return (
		<DataTable
			shouldRender={!isLoading}
			headers={headers}
			data={monitors}
			config={{
				rowSX: {
					cursor: "pointer",
					"&:hover": {
						backgroundColor: theme.palette.background.accent,
					},
				},
				onRowClick: (row) => {
					navigate(`/distributed-uptime/${row._id}`);
				},
			}}
		/>
	);
};

MonitorTable.propTypes = {
	isLoading: PropTypes.bool,
	monitors: PropTypes.array,
};

export default MonitorTable;

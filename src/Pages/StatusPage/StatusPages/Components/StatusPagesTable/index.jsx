import DataTable from "../../../../../Components/Table";
import { useTheme } from "@emotion/react";
import { useNavigate } from "react-router-dom";
import { ColoredLabel } from "../../../../../Components/Label";
import ArrowOutwardIcon from "@mui/icons-material/ArrowOutward";
import { Stack, Typography } from "@mui/material";
const StatusPagesTable = ({ data }) => {
	const theme = useTheme();
	const navigate = useNavigate();
	const headers = [
		{
			id: "name",
			content: "Status page name",
			render: (row) => {
				return row.companyName;
			},
		},
		{
			id: "url",
			content: "URL",
			render: (row) => {
				return (
					<Stack
						direction="row"
						alignItems="center"
						gap={theme.spacing(2)}
					>
						<Typography>{`/${row.url}`}</Typography>
						<ArrowOutwardIcon />
					</Stack>
				);
			},
		},
		{
			id: "type",
			content: "Type",
			render: (row) => {
				return row.type;
			},
		},
		{
			id: "status",
			content: "Status",
			render: (row) => {
				return (
					<ColoredLabel
						label={row.isPublished ? "Published" : "Unpublished"}
						color={
							row.isPublished ? theme.palette.success.main : theme.palette.warning.main
						}
					/>
				);
			},
		},
	];

	const handleRowClick = (statusPage) => {
		if (statusPage.type === "distributed") {
			navigate(`/status/distributed/${statusPage.url}`);
		} else if (statusPage.type === "uptime") {
			navigate(`/status/uptime/${statusPage.url}`);
		}
	};

	return (
		<DataTable
			config={{
				rowSX: {
					cursor: "pointer",
					"&:hover td": {
						backgroundColor: theme.palette.tertiary.main,
						transition: "background-color .3s ease",
					},
				},
				onRowClick: (row) => {
					handleRowClick(row);
				},
			}}
			headers={headers}
			data={data}
		/>
	);
};

export default StatusPagesTable;

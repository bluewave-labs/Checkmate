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
			content: "Public URL",
			onClick: (e, row) => {
				if (row.isPublished) {
					e.stopPropagation();
					const url =
						row.type === "distributed"
							? `/status/distributed/public/${row.url}`
							: `/status/uptime/public/${row.url}`;
					navigate(url);
				}
			},
			getCellSx: (row) => {
				return {
					...(row.isPublished && {
						"&.MuiTableCell-root:hover": {
							backgroundColor: `${theme.palette.primary.light}`,
							cursor: "pointer",
							borderRadius: 1,
						},
					}),
				};
			},
			render: (row) => {
				const content = row.isPublished ? `/${row.url}` : "Unpublished";
				return (
					<Stack
						direction="row"
						alignItems="center"
						gap={theme.spacing(2)}
					>
						<Typography>{content}</Typography>
						{row.isPublished && <ArrowOutwardIcon />}
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

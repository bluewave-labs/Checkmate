import DataTable from "../../../../../Components/Table";
import { useTheme } from "@emotion/react";
import { useNavigate } from "react-router-dom";
import { StatusLabel } from "../../../../../Components/Label";
import ArrowOutwardIcon from "@mui/icons-material/ArrowOutward";
import { Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
const StatusPagesTable = ({ data }) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const navigate = useNavigate();
	const headers = [
		{
			id: "name",
			content: t("statusPageName"),
			render: (row) => {
				return row.companyName;
			},
		},
		{
			id: "url",
			content: t("publicURL"),
			onClick: (e, row) => {
				if (row.isPublished) {
					e.stopPropagation();
					const url =
						row.type === "distributed"
							? `/status/distributed/public/${row.url}`
							: `/status/uptime/public/${row.url}`;
					window.open(url, "_blank", "noopener,noreferrer");
				}
			},
			render: (row) => {
				const content = row.isPublished ? `/${row.url}` : "Unpublished";
				return (
					<Stack
						direction="row"
						alignItems="center"
						justifyContent="center"
						gap={theme.spacing(2)}
						paddingLeft={theme.spacing(2)}
						paddingRight={theme.spacing(2)}
						borderRadius={theme.spacing(4)}
						sx={{
							...(row.isPublished && {
								":hover": {
									backgroundColor: `${theme.palette.primary.light}`,
									cursor: "pointer",
									borderRadius: 1,
								},
							}),
						}}
					>
						<Typography>{content}</Typography>
						{row.isPublished && <ArrowOutwardIcon />}
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
			id: "status",
			content: t("status"),
			render: (row) => {
				const status = row.isPublished ? "published" : "unpublished";
				return (
					<StatusLabel
						status={status}
						text={row.isPublished ? "Published" : "Unpublished"}
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

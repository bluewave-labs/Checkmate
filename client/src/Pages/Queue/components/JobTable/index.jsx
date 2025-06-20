import Stack from "@mui/material/Stack";
import DataTable from "../../../../Components/Table";
import Typography from "@mui/material/Typography";
// Utils
import PropTypes from "prop-types";
import { useTheme } from "@emotion/react";
import { useNavigate } from "react-router-dom";
import { TypeToPathMap } from "../../../../Utils/monitorUtils";
import { useTranslation } from "react-i18next";

const JobTable = ({ jobs = [] }) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const navigate = useNavigate();
	const buildSx = (row) => {
		if (row.lockedAt) {
			return {
				color: `${theme.palette.success.main} !important`,
			};
		}
		if (!row.active) {
			return {
				color: `${theme.palette.warning.main} !important`,
			};
		}

		if (row.failCount > 0 && row.lastFailedAt >= row.lastFinishedAt) {
			return {
				color: `${theme.palette.error.main} !important`,
			};
		}

		return {};
	};

	const headers = [
		{
			id: "id",
			content: t("queuePage.jobTable.idHeader"),
			render: (row) => {
				return row.monitorId;
			},
			getCellSx: (row) => {
				return buildSx(row);
			},
		},
		{
			id: "url",
			content: t("queuePage.jobTable.urlHeader"),
			render: (row) => {
				return row.monitorUrl;
			},
			getCellSx: (row) => {
				return buildSx(row);
			},
		},
		{
			id: "type",
			content: t("queuePage.jobTable.typeHeader"),
			render: (row) => {
				return row.monitorType;
			},
			getCellSx: (row) => {
				return buildSx(row);
			},
		},
		{
			id: "active",
			content: t("queuePage.jobTable.activeHeader"),
			render: (row) => {
				return row.active.toString();
			},
			getCellSx: (row) => {
				return buildSx(row);
			},
		},
		{
			id: "runCount",
			content: t("queuePage.jobTable.runCountHeader"),
			render: (row) => {
				return row.runCount;
			},
			getCellSx: (row) => {
				return buildSx(row);
			},
		},
		{
			id: "failCount",
			content: t("queuePage.jobTable.failCountHeader"),
			render: (row) => {
				return row.failCount;
			},
			getCellSx: (row) => {
				return buildSx(row);
			},
		},
		{
			id: "lastRun",
			content: t("queuePage.jobTable.lastRunHeader"),
			render: (row) => {
				return row.lastRunAt || "-";
			},
			getCellSx: (row) => {
				return buildSx(row);
			},
		},
		{
			id: "lockedAt",
			content: t("queuePage.jobTable.lockedAtHeader"),
			render: (row) => {
				return row.lockedAt || "-";
			},
			getCellSx: (row) => {
				return buildSx(row);
			},
		},
		{
			id: "lastFinish",
			content: t("queuePage.jobTable.lastFinishedAtHeader"),
			render: (row) => {
				return row.lastFinishedAt || "-";
			},
			getCellSx: (row) => {
				return buildSx(row);
			},
		},
		{
			id: "lastRunTook",
			content: t("queuePage.jobTable.lastRunTookHeader"),
			render: (row) => {
				const value = row.lastRunTook ? row.lastRunTook + " ms" : "-";
				return value;
			},
			getCellSx: (row) => {
				return buildSx(row);
			},
		},
	];

	return (
		<Stack gap={theme.spacing(2)}>
			<Typography variant="h2">{t("queuePage.jobTable.title")}</Typography>
			<DataTable
				headers={headers}
				data={jobs}
				config={{
					onRowClick: (row) => {
						const path = TypeToPathMap[row.monitorType];
						navigate(`/${path}/${row.monitorId}`);
					},
					rowSX: {
						cursor: "pointer",
						"&:hover td": {
							backgroundColor: theme.palette.tertiary.main,
							transition: "background-color .3s ease",
						},
					},
				}}
			/>
		</Stack>
	);
};

JobTable.propTypes = {
	jobs: PropTypes.array,
};

export default JobTable;

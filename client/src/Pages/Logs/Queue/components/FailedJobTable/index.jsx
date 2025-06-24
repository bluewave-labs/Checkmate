import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import DataTable from "../../../../../Components/Table";

import { useNavigate } from "react-router-dom";
import { useTheme } from "@emotion/react";
import { TypeToPathMap } from "../../../../../Utils/monitorUtils";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";

const FailedJobTable = ({ metrics = {} }) => {
	const { t } = useTranslation();
	const theme = useTheme();
	const jobsWithFailures = metrics?.jobsWithFailures;
	const navigate = useNavigate();

	const headers = [
		{
			id: "monitorId",
			content: t("queuePage.failedJobTable.monitorIdHeader"),
			render: (row) => {
				return row.monitorId;
			},
		},
		{
			id: "monitorUrl",
			content: t("queuePage.failedJobTable.monitorUrlHeader"),
			render: (row) => {
				return row.monitorUrl;
			},
		},
		{
			id: "failCount",
			content: t("queuePage.failedJobTable.failCountHeader"),
			render: (row) => {
				return row.failCount;
			},
		},
		{
			id: "failedAt",
			content: t("queuePage.failedJobTable.failedAtHeader"),
			render: (row) => {
				return row.failedAt;
			},
		},
		{
			id: "failReason",
			content: t("queuePage.failedJobTable.failReasonHeader"),
			render: (row) => {
				return row.failReason;
			},
		},
	];
	return (
		<Stack gap={theme.spacing(2)}>
			<Typography variant="h2">{t("queuePage.failedJobTable.title")}</Typography>
			<DataTable
				headers={headers}
				data={jobsWithFailures}
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

FailedJobTable.propTypes = {
	metrics: PropTypes.object,
};

export default FailedJobTable;

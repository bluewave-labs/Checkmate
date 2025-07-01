import PropTypes from "prop-types";
import { Stack } from "@mui/material";
import StatusBox from "./StatusBox";
import { useTheme } from "@emotion/react";
import { useTranslation } from "react-i18next";
import SkeletonLayout from "./skeleton";

const StatusBoxes = ({ isLoading, summary }) => {
	const theme = useTheme();
	const { t } = useTranslation();
	if (isLoading) return <SkeletonLayout shouldRender={isLoading} />;
	return (
		<Stack
			gap={theme.spacing(12)}
			direction="row"
			justifyContent="space-between"
		>
			<StatusBox
				title={t("incidentsOptionsHeaderTotalIncidents")}
				value={summary?.totalChecks || 0}
			/>
			<StatusBox
				title={t("incidentsOptionsHeaderFilterResolved")}
				status="up"
				value={summary?.resolvedChecks || 0}
			/>
			<StatusBox
				title={t("incidentsOptionsHeaderFilterCannotResolve")}
				status="paused"
				value={summary?.cannotResolveChecks || 0}
			/>
			<StatusBox
				title={t("incidentsOptionsHeaderFilterDown")}
				status="down"
				value={summary?.downChecks || 0}
			/>
		</Stack>
	);
};

StatusBoxes.propTypes = {
	isLoading: PropTypes.bool,
	summary: PropTypes.object,
};

export default StatusBoxes;

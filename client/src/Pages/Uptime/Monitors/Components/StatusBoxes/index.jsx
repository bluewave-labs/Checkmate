import PropTypes from "prop-types";
import { Stack } from "@mui/material";
import StatusBox from "./statusBox";
import { useTheme } from "@emotion/react";
import { useTranslation } from "react-i18next";
import SkeletonLayout from "./skeleton";

const StatusBoxes = ({ shouldRender, monitorsSummary }) => {
	const theme = useTheme();
	const { t } = useTranslation();
	if (!shouldRender) return <SkeletonLayout shouldRender={shouldRender} />;
	return (
		<Stack
			gap={theme.spacing(8)}
			direction="row"
			justifyContent="space-between"
		>
			<StatusBox
				title={t("monitorStatus.up")}
				status="up"
				value={monitorsSummary?.upMonitors ?? 0}
			/>
			<StatusBox
				title={t("monitorStatus.down")}
				status="down"
				value={monitorsSummary?.downMonitors ?? 0}
			/>
			<StatusBox
				title={t("monitorStatus.paused")}
				status="paused"
				value={monitorsSummary?.pausedMonitors ?? 0}
			/>
		</Stack>
	);
};

StatusBoxes.propTypes = {
	monitorsSummary: PropTypes.object,
	shouldRender: PropTypes.bool,
};

export default StatusBoxes;

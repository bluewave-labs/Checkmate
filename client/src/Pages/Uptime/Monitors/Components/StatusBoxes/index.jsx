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
				title={t("monitorStatus.up").toUpperCase()}
				value={monitorsSummary?.upMonitors ?? 0}
			/>
			<StatusBox
				title={t("monitorStatus.down").toUpperCase()}
				value={monitorsSummary?.downMonitors ?? 0}
			/>
			<StatusBox
				title={t("monitorStatus.paused").toUpperCase()}
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

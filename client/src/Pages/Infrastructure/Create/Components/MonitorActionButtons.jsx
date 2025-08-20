import { useState } from "react";
import { Box, Button } from "@mui/material";
import { useTheme } from "@emotion/react";
import { useTranslation } from "react-i18next";
import PauseCircleOutlineIcon from "@mui/icons-material/PauseCircleOutline";
import PlayCircleOutlineRoundedIcon from "@mui/icons-material/PlayCircleOutlineRounded";
import Dialog from "../../../../Components/Dialog";
import PropTypes from "prop-types";

const MonitorActionButtons = ({ monitor, isBusy, handlePause, handleRemove }) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const [isOpen, setIsOpen] = useState(false);

	return (
		<Box
			alignSelf="flex-end"
			ml="auto"
		>
			<Button
				onClick={handlePause}
				loading={isBusy}
				variant="contained"
				color="secondary"
				sx={{
					pl: theme.spacing(4),
					pr: theme.spacing(6),
					"& svg": {
						mr: theme.spacing(2),
						"& path": {
							stroke: theme.palette.primary.contrastTextTertiary,
							strokeWidth: 0.1,
						},
					},
				}}
			>
				{monitor?.isActive ? (
					<>
						<PauseCircleOutlineIcon />
						{t("pause")}
					</>
				) : (
					<>
						<PlayCircleOutlineRoundedIcon />
						{t("resume")}
					</>
				)}
			</Button>
			<Button
				loading={isBusy}
				variant="contained"
				color="error"
				onClick={() => setIsOpen(true)}
				sx={{ ml: theme.spacing(6) }}
			>
				{t("remove")}
			</Button>
			<Dialog
				open={isOpen}
				theme={theme}
				title={t("deleteDialogTitle")}
				description={t("deleteDialogDescription")}
				onCancel={() => setIsOpen(false)}
				confirmationButtonLabel={t("delete")}
				onConfirm={handleRemove}
			/>
		</Box>
	);
};

MonitorActionButtons.propTypes = {
	monitor: PropTypes.object.isRequired,
	isBusy: PropTypes.bool.isRequired,
	handlePause: PropTypes.func.isRequired,
	handleRemove: PropTypes.func.isRequired,
};

export default MonitorActionButtons;

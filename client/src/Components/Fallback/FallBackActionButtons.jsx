import { Button, Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PropTypes from "prop-types";

const FallbackActionButtons = ({ link, type }) => {
	const theme = useTheme();
	const navigate = useNavigate();
	const { t } = useTranslation();

	return (
		<Stack
			gap={theme.spacing(10)}
			alignItems="center"
		>
			<Button
				variant="contained"
				color="accent"
				onClick={() => navigate(link)}
			>
				{t(`${type}.fallback.actionButton`)}
			</Button>
			{type === "uptimeMonitor" && (
				<Button
					variant="contained"
					color="accent"
					sx={{ alignSelf: "center" }}
					onClick={() => navigate("/uptime/bulk-import")}
				>
					{t("bulkImport.fallbackPage")}
				</Button>
			)}
		</Stack>
	);
};
FallbackActionButtons.propTypes = {
	title: PropTypes.string.isRequired,
	link: PropTypes.string.isRequired,
	type: PropTypes.string.isRequired,
};

export default FallbackActionButtons;

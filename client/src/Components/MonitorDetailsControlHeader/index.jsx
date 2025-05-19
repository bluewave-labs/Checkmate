import Stack from "@mui/material/Stack";
import Status from "./status";
import Skeleton from "./skeleton";
import Button from "@mui/material/Button";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import PauseOutlinedIcon from "@mui/icons-material/PauseOutlined";
import PlayArrowOutlinedIcon from "@mui/icons-material/PlayArrowOutlined";
import EmailIcon from "@mui/icons-material/Email";

// Utils
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import { usePauseMonitor } from "../../Hooks/useMonitorControls";
import { useSendTestEmail } from "../../Hooks/useSendTestEmail";
import { useTranslation } from "react-i18next";

/**
 * MonitorDetailsControlHeader component displays the control header for monitor details.
 * It includes status display, pause/resume button, and a configure button for admins.
 *
 * @component
 * @param {Object} props - Component props
 * @param {string} props.path - The base path for navigation
 * @param {boolean} [props.isLoading=false] - Flag indicating if the data is loading
 * @param {boolean} [props.isAdmin=false] - Flag indicating if the user is an admin
 * @param {Object} props.monitor - The monitor object containing details
 * @param {Function} props.triggerUpdate - Function to trigger an update
 * @returns {JSX.Element} The rendered component
 */
const MonitorDetailsControlHeader = ({
	path,
	isLoading = false,
	isAdmin = false,
	monitor,
	triggerUpdate,
}) => {
	const navigate = useNavigate();
	const theme = useTheme();
	const { t } = useTranslation();
	const [pauseMonitor, isPausing, error] = usePauseMonitor({
		monitorId: monitor?._id,
		triggerUpdate,
	});

	const [isSending, emailError, sendTestEmail] = useSendTestEmail();

	if (isLoading) {
		return <Skeleton />;
	}

	return (
		<Stack
			direction="row"
			justifyContent="space-between"
		>
			<Status monitor={monitor} />

			<Stack
				direction="row"
				gap={theme.spacing(2)}
			>
				<Button
					variant="contained"
					color="secondary"
					loading={isSending}
					startIcon={<EmailIcon />}
					onClick={sendTestEmail}
				>
					{t("sendTestEmail")}
				</Button>
				<Button
					variant="contained"
					color="secondary"
					onClick={(e) => {
						navigate(`/incidents/${monitor?._id}`);
					}}
				>
					{t("menu.incidents")}
				</Button>
				<Button
					variant="contained"
					color="secondary"
					loading={isPausing}
					startIcon={
						monitor?.isActive ? <PauseOutlinedIcon /> : <PlayArrowOutlinedIcon />
					}
					onClick={() => {
						pauseMonitor();
					}}
				>
					{monitor?.isActive ? "Pause" : "Resume"}
				</Button>

				{isAdmin && (
					<Button
						variant="contained"
						color="secondary"
						startIcon={<SettingsOutlinedIcon />}
						onClick={() => navigate(`/${path}/configure/${monitor._id}`)}
					>
						Configure
					</Button>
				)}
			</Stack>
		</Stack>
	);
};

MonitorDetailsControlHeader.propTypes = {
	path: PropTypes.string,
	isLoading: PropTypes.bool,
	isAdmin: PropTypes.bool,
	monitor: PropTypes.object,
	triggerUpdate: PropTypes.func,
};

export default MonitorDetailsControlHeader;

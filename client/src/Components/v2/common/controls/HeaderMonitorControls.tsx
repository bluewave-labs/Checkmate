import Stack from "@mui/material/Stack";
import { Icon, MonitorStatus } from "@/Components/v2/design-elements";
import { Button } from "@/Components/v2/inputs";
import { Settings, Pause, Play, Mail, Bug } from "lucide-react";

import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";

import type { Monitor } from "@/Types/Monitor.js";

interface HeaderMonitorControlsProps {
	path: string;
	monitor: Monitor;
	isAdmin: boolean;
}

export const HeaderMonitorControls = ({
	path,
	monitor,
	isAdmin,
}: HeaderMonitorControlsProps) => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const theme = useTheme();
	return (
		<Stack
			spacing={{ xs: theme.spacing(4), md: 0 }}
			direction={{ xs: "column", md: "row" }}
			alignItems={"center"}
			justifyContent={"space-between"}
		>
			<MonitorStatus monitor={monitor} />
			<Stack
				width={{ xs: "100%", md: "auto" }}
				direction={{ xs: "column", md: "row" }}
				gap={theme.spacing(2)}
			>
				<Button
					variant="contained"
					color="secondary"
					// loading={isSending}
					startIcon={<Icon icon={Mail} />}
					// disabled={isTestNotificationsDisabled}
					onClick={() => {
						// testAllNotifications({ monitorId: monitor?.id });
					}}
					sx={{
						whiteSpace: "nowrap",
					}}
				>
					{t("common.buttons.testNotifications")}
				</Button>
				<Button
					variant="contained"
					color="secondary"
					startIcon={<Icon icon={Bug} />}
					onClick={(e) => {
						navigate(`/incidents/${monitor?.id}`);
					}}
				>
					{t("common.buttons.incidents")}
				</Button>
				{isAdmin && (
					<Button
						variant="contained"
						color="secondary"
						// loading={isPausing}
						startIcon={monitor?.isActive ? <Icon icon={Pause} /> : <Icon icon={Play} />}
						onClick={() => {
							// pauseMonitor({
							// 	monitorId: monitor?.id,
							// 	triggerUpdate,
							// });
						}}
					>
						{monitor?.isActive ? t("pause") : t("resume")}
					</Button>
				)}
				{isAdmin && (
					<Button
						variant="contained"
						color="secondary"
						startIcon={<Icon icon={Settings} />}
						onClick={() => navigate(`/${path}/configure/${monitor.id}`)}
					>
						Configure
					</Button>
				)}
			</Stack>
		</Stack>
	);
};

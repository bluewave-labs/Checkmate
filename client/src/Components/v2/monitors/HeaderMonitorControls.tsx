import Stack from "@mui/material/Stack";
import { Icon, MonitorStatus } from "@/Components/v2/design-elements";
import { Button } from "@/Components/v2/inputs";
import { Settings, Pause, Play, Mail, Bug, Trash } from "lucide-react";

import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import { usePost } from "@/Hooks/UseApi";

import type { Monitor } from "@/Types/Monitor.js";
interface BaseHeaderProps {
	monitor: Monitor;
}

const BaseHeader = ({ monitor, children }: React.PropsWithChildren<BaseHeaderProps>) => {
	const theme = useTheme();
	return (
		<Stack
			spacing={{ xs: theme.spacing(8), md: 0 }}
			direction={{ xs: "column", md: "row" }}
			alignItems={"center"}
			justifyContent={"space-between"}
		>
			<MonitorStatus monitor={monitor} />
			{children}
		</Stack>
	);
};

interface HeaderMonitorControlsProps {
	path: string;
	monitor?: Monitor | null;
	isAdmin: boolean;
	refetch: Function;
}

export const HeaderMonitorControls = ({
	path,
	monitor,
	isAdmin,
	refetch,
}: HeaderMonitorControlsProps) => {
	const { t } = useTranslation();
	const theme = useTheme();
	const navigate = useNavigate();
	const {
		post,
		loading: isPosting,
		// error: postError,
	} = usePost<any, Monitor>();

	if (!monitor) {
		return null;
	}
	return (
		<BaseHeader monitor={monitor}>
			<Stack
				width={{ xs: "100%", md: "auto" }}
				direction={{ xs: "column", md: "row" }}
				gap={theme.spacing(2)}
			>
				<Button
					variant="contained"
					color="secondary"
					loading={isPosting}
					startIcon={<Icon icon={Mail} />}
					onClick={async () => {
						await post(`/notifications/test/all`, { monitorId: monitor.id });
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
					onClick={() => {
						navigate(`/incidents/${monitor?.id}`);
					}}
				>
					{t("common.buttons.incidents")}
				</Button>
				{isAdmin && (
					<Button
						variant="contained"
						color="secondary"
						loading={isPosting}
						startIcon={monitor?.isActive ? <Icon icon={Pause} /> : <Icon icon={Play} />}
						onClick={async () => {
							await post(`/monitors/pause/${monitor.id}`, {});
							await refetch();
						}}
					>
						{monitor?.isActive ? t("common.buttons.pause") : t("common.buttons.resume")}
					</Button>
				)}
				{isAdmin && (
					<Button
						variant="contained"
						color="secondary"
						startIcon={<Icon icon={Settings} />}
						onClick={() => navigate(`/${path}/configure/${monitor.id}`)}
					>
						{t("common.buttons.configure")}
					</Button>
				)}
			</Stack>
		</BaseHeader>
	);
};

interface HeaderDeleteControlsProps {
	monitor?: Monitor | null;
	isAdmin: boolean;
	refetch: Function;
	onDelete?: () => void;
}

export const HeaderDeleteControls = ({
	monitor,
	isAdmin,
	refetch,
	onDelete,
}: HeaderDeleteControlsProps) => {
	const { t } = useTranslation();
	const theme = useTheme();
	const {
		post,
		loading: isPosting,
		// error: postError,
	} = usePost<any, Monitor>();

	if (!monitor) {
		return null;
	}
	return (
		<BaseHeader monitor={monitor}>
			<Stack
				width={{ xs: "100%", md: "auto" }}
				direction={{ xs: "column", md: "row" }}
				gap={theme.spacing(2)}
			>
				{isAdmin && (
					<Button
						variant="contained"
						color="secondary"
						loading={isPosting}
						startIcon={monitor?.isActive ? <Icon icon={Pause} /> : <Icon icon={Play} />}
						onClick={async () => {
							await post(`/monitors/pause/${monitor.id}`, {});
							await refetch();
						}}
					>
						{monitor?.isActive ? t("common.buttons.pause") : t("common.buttons.resume")}
					</Button>
				)}
				{isAdmin && (
					<Button
						variant="contained"
						color="error"
						startIcon={<Icon icon={Trash} />}
						onClick={() => {
							onDelete?.();
						}}
					>
						{t("common.buttons.delete")}
					</Button>
				)}
			</Stack>
		</BaseHeader>
	);
};

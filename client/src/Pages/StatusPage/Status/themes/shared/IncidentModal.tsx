import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import { X as XIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useGet } from "@/Hooks/UseApi";
import { useTheme } from "@mui/material";
import { SPACING } from "@/Utils/Theme/constants";

import type { Incident } from "@/Types/Incident";
import { formatDate } from "@/Utils/TimeUtils";
interface IncidentModalProps {
	url: string;
	monitorId: string | null;
	date: string | null;
	timezone: string;
	onClose: () => void;
}

export const IncidentModal = ({
	url,
	monitorId,
	date,
	timezone,
	onClose,
}: IncidentModalProps) => {
	const theme = useTheme();
	const { t, i18n } = useTranslation();
	const formatTime = (value: string) =>
		formatDate(value, "time", {
			timeZone: timezone,
			locale: i18n.resolvedLanguage ?? "en",
			timeFormat: "auto",
		});

	const open = Boolean(monitorId && date);

	const { data, isLoading, error } = useGet<{ incidents: Incident[] }>(
		open ? `/status-page/${url}/incidents/${monitorId}?date=${date}` : null,
		{},
		{ revalidateOnFocus: false, keepPreviousData: true }
	);

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="sm"
			fullWidth
		>
			<DialogTitle
				sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
			>
				{t("pages.statusPages.monitorsList.incidents.modalTitle", { date })} ({timezone})
				<IconButton
					onClick={onClose}
					size="small"
					aria-label="close"
				>
					<XIcon size={20} />
				</IconButton>
			</DialogTitle>
			<DialogContent>
				{isLoading ? (
					<Typography mt={SPACING.SM}>
						{t("pages.statusPages.monitorsList.incidents.loading")}
					</Typography>
				) : error ? (
					<Typography
						mt={SPACING.SM}
						color={theme.palette.error.main}
					>
						{t("pages.statusPages.monitorsList.incidents.errorLoading")}
					</Typography>
				) : data?.incidents && data.incidents.length > 0 ? (
					<Stack
						gap={SPACING.LG}
						mt={SPACING.SM}
					>
						{data.incidents.map((incident) => (
							<Stack
								key={incident.id}
								p={SPACING.LG}
								border={1}
								borderColor="divider"
								borderRadius={theme.shape.borderRadius}
							>
								<Typography
									variant="subtitle2"
									fontWeight="bold"
								>
									{incident.message ||
										(incident.statusCode ? `Error ${incident.statusCode}` : "Incident")}
								</Typography>
								<Typography
									variant="body2"
									color={theme.palette.text.secondary}
								>
									{formatTime(incident.startTime)} -{" "}
									{incident.endTime
										? formatTime(incident.endTime)
										: t("pages.statusPages.monitorsList.incidents.ongoing")}
								</Typography>
							</Stack>
						))}
					</Stack>
				) : (
					<Typography mt={SPACING.SM}>
						{t("pages.statusPages.monitorsList.incidents.noIncidents")}
					</Typography>
				)}
			</DialogContent>
		</Dialog>
	);
};

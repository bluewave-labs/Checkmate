import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import { X as XIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useGet } from "@/Hooks/UseApi";

interface Incident {
	id: string;
	message: string | null;
	startTime: string;
	endTime: string | null;
	statusCode: number | null;
}

interface IncidentModalProps {
	url: string;
	monitorId: string | null;
	date: string | null;
	onClose: () => void;
}

export const IncidentModal = ({ url, monitorId, date, onClose }: IncidentModalProps) => {
	const { t } = useTranslation();
	const open = Boolean(monitorId && date);

	const { data, isLoading } = useGet<{ incidents: Incident[] }>(
		open ? `/status-page/${url}/incidents/${monitorId}?date=${date}` : null,
		{},
		{ revalidateOnFocus: false }
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
				{t("pages.statusPages.monitorsList.incidents.modalTitle", { date })}
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
					<Typography mt={1}>
						{t("pages.statusPages.monitorsList.incidents.loading")}
					</Typography>
				) : data?.incidents && data.incidents.length > 0 ? (
					<Stack
						gap={2}
						mt={1}
					>
						{data.incidents.map((incident) => (
							<Stack
								key={incident.id}
								p={2}
								border={1}
								borderColor="divider"
								borderRadius={1}
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
									color={(theme) => theme.palette.text.secondary}
								>
									{new Date(incident.startTime).toLocaleTimeString()} -{" "}
									{incident.endTime
										? new Date(incident.endTime).toLocaleTimeString()
										: t("pages.statusPages.monitorsList.incidents.ongoing")}
								</Typography>
							</Stack>
						))}
					</Stack>
				) : (
					<Typography mt={1}>
						{t("pages.statusPages.monitorsList.incidents.noIncidents")}
					</Typography>
				)}
			</DialogContent>
		</Dialog>
	);
};

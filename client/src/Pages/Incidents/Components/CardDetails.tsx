import Stack from "@mui/material/Stack";
import Grid from "@mui/material/Grid";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import { BaseBox, ValueLabel } from "@/Components/v2/design-elements";

import { useTranslation } from "react-i18next";
import type { Incident } from "@/Types/Incident";
import type { Monitor } from "@/Types/Monitor";
import { useTheme } from "@mui/material";
import { useSelector } from "react-redux";
import type { RootState } from "@/Types/state";
import { formatDateWithTz } from "@/Utils/TimeUtils";
import { getIncidentsDuration } from "@/Pages/Incidents/utils";

interface CardDetailsProps {
	incident: Incident | null;
	monitor: Monitor | null;
	sx?: object;
}

export const CardDetails = ({ incident, monitor, sx }: CardDetailsProps) => {
	const { t } = useTranslation();
	const theme = useTheme();
	const uiTimezone = useSelector((state: RootState) => state.ui.timezone);

	if (!incident) {
		return null;
	}
	return (
		<Stack
			gap={theme.spacing(4)}
			sx={sx}
		>
			<Typography textTransform={"uppercase"}>
				{t("pages.incidents.dialog.details.title")}
			</Typography>
			<BaseBox padding={8}>
				<Stack gap={theme.spacing(4)}>
					<Typography textTransform={"uppercase"}>
						{t("pages.incidents.dialog.details.overview")}
					</Typography>
					<Divider />

					<Grid
						container
						spacing={theme.spacing(4)}
						alignItems="center"
					>
						<Grid size={2}>{t("pages.incidents.dialog.details.status")}</Grid>
						<Grid size={10}>
							<ValueLabel
								value={incident.status ? "negative" : "positive"}
								text={
									incident.status
										? t("common.labels.active")
										: t("common.labels.resolved")
								}
							/>
						</Grid>
						{monitor && (
							<>
								<Grid size={2}>{t("pages.incidents.dialog.details.monitor")}</Grid>
								<Grid size={10}>
									<Typography>{monitor.name ?? "N/A"}</Typography>
								</Grid>
								<Grid size={2}>
									<Typography>{t("pages.incidents.dialog.details.url")}</Typography>
								</Grid>
								<Grid size={10}>
									<Typography>{monitor.url ?? "N/A"}</Typography>
								</Grid>
							</>
						)}
					</Grid>
				</Stack>
			</BaseBox>
			<BaseBox padding={8}>
				<Stack gap={theme.spacing(4)}>
					<Typography textTransform={"uppercase"}>
						{t("pages.incidents.dialog.details.analysis")}
					</Typography>
					<Divider />
					<Grid
						container
						spacing={theme.spacing(2)}
					>
						<Grid size={6}>
							<Typography>{t("pages.incidents.dialog.details.timeline")}</Typography>
						</Grid>
						<Grid size={6}>
							<Typography>{t("pages.incidents.dialog.details.detailsLabel")}</Typography>
						</Grid>
						<Grid size={6}>
							<Divider></Divider>
						</Grid>
						<Grid size={6}>
							<Divider></Divider>
						</Grid>
						<Grid size={2}>
							<Typography>{t("pages.incidents.dialog.details.startedAt")}</Typography>
						</Grid>
						<Grid size={4}>
							<Typography>
								{formatDateWithTz(incident.startTime, "D MMM YYYY, h:mm A", uiTimezone)}
							</Typography>
						</Grid>
						<Grid size={2}>
							<Typography>{t("pages.incidents.dialog.details.statusCode")}</Typography>
						</Grid>
						<Grid size={4}>
							<Typography>{incident.statusCode ?? "N/A"}</Typography>
						</Grid>
						<Grid size={2}>
							<Typography>{t("pages.incidents.dialog.details.downtime")}</Typography>
						</Grid>
						<Grid size={4}>
							<Typography>{getIncidentsDuration(incident)}</Typography>
						</Grid>
						<Grid size={2}>
							<Typography>{t("pages.incidents.dialog.details.message")}</Typography>
						</Grid>
						<Grid size={4}>
							<Typography>{incident.message ?? "N/A"}</Typography>
						</Grid>
					</Grid>
				</Stack>
			</BaseBox>
			{!incident.status && (
				<BaseBox padding={8}>
					<Stack gap={theme.spacing(4)}>
						<Typography textTransform={"uppercase"}>
							{t("pages.incidents.dialog.details.resolutionDetails")}
						</Typography>
						<Divider />
						<Grid
							container
							spacing={theme.spacing(2)}
							alignItems="center"
						>
							<Grid size={2}>
								<Typography>{t("pages.incidents.dialog.details.resolvedAt")}</Typography>
							</Grid>
							<Grid size={10}>
								<Typography>
									{incident.endTime
										? formatDateWithTz(incident.endTime, "D MMM YYYY, h:mm A", uiTimezone)
										: "N/A"}
								</Typography>
							</Grid>
							<Grid size={2}>
								<Typography>
									{t("pages.incidents.dialog.details.resolutionType")}
								</Typography>
							</Grid>
							<Grid size={10}>
								<Typography>
									{incident.resolutionType
										? t(
												`pages.incidents.dialog.details.resolutionTypes.${incident.resolutionType}`
											)
										: "N/A"}
								</Typography>
							</Grid>
							{incident.resolvedBy && (
								<>
									<Grid size={2}>
										<Typography>
											{t("pages.incidents.dialog.details.resolvedBy")}
										</Typography>
									</Grid>
									<Grid size={10}>
										<Typography>
											{incident.resolvedByEmail ?? incident.resolvedBy}
										</Typography>
									</Grid>
								</>
							)}
							{incident.comment && (
								<>
									<Grid size={2}>
										<Typography>{t("pages.incidents.dialog.details.comment")}</Typography>
									</Grid>
									<Grid size={10}>
										<Typography>{incident.comment}</Typography>
									</Grid>
								</>
							)}
						</Grid>
					</Stack>
				</BaseBox>
			)}
		</Stack>
	);
};

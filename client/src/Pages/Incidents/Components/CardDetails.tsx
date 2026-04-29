import Stack from "@mui/material/Stack";
import Grid from "@mui/material/Grid";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import { BaseBox, ValueLabel } from "@/Components/design-elements";
import { LAYOUT } from "@/Utils/Theme/constants";

import { useTranslation } from "react-i18next";
import type { Incident } from "@/Types/Incident";
import type { Monitor } from "@/Types/Monitor";
import { useTheme } from "@mui/material";
import { useSelector } from "react-redux";
import type { RootState } from "@/Types/state";
import { formatDateWithTz } from "@/Utils/TimeUtils";
import { getIncidentsDuration } from "@/Pages/Incidents/utils";
import { theme } from "@/Utils/Theme/Theme";

interface CardDetailsProps {
	incident: Incident | null;
	monitor: Monitor | null;
	sx?: object;
}

const SectionHeading = ({ children }: { children: React.ReactNode }) => {
	const theme = useTheme();

	return (
		<Typography
			component="h2"
			variant="eyebrow"
			color={theme.palette.text.secondary}
		>
			{children}
		</Typography>
	);
};

const Cell = ({ children }: { children: React.ReactNode }) => (
	<Typography variant="body1">{children}</Typography>
);

export const CardDetails = ({ incident, monitor, sx }: CardDetailsProps) => {
	const { t } = useTranslation();
	const theme = useTheme();
	const uiTimezone = useSelector((state: RootState) => state.ui.timezone);

	if (!incident) {
		return null;
	}
	return (
		<Stack
			gap={theme.spacing(LAYOUT.MD)}
			sx={sx}
		>
			<SectionHeading>{t("pages.incidents.dialog.details.title")}</SectionHeading>
			<BaseBox padding={LAYOUT.MD}>
				<Stack gap={theme.spacing(LAYOUT.MD)}>
					<SectionHeading>{t("pages.incidents.dialog.details.overview")}</SectionHeading>
					<Grid
						container
						spacing={theme.spacing(LAYOUT.MD)}
						alignItems="center"
					>
						<Grid size={2}>
							<Cell>{t("pages.incidents.dialog.details.status")}</Cell>
						</Grid>
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
								<Grid size={2}>
									<Cell>{t("pages.incidents.dialog.details.monitor")}</Cell>
								</Grid>
								<Grid size={10}>
									<Cell>{monitor.name ?? "N/A"}</Cell>
								</Grid>
								<Grid size={2}>
									<Cell>{t("pages.incidents.dialog.details.url")}</Cell>
								</Grid>
								<Grid size={10}>
									<Cell>{monitor.url ?? "N/A"}</Cell>
								</Grid>
							</>
						)}
					</Grid>
				</Stack>
			</BaseBox>
			<BaseBox padding={LAYOUT.MD}>
				<Stack gap={theme.spacing(LAYOUT.MD)}>
					<SectionHeading>{t("pages.incidents.dialog.details.analysis")}</SectionHeading>
					<Grid
						container
						spacing={theme.spacing(LAYOUT.MD)}
					>
						<Grid size={6}>
							<Cell>{t("pages.incidents.dialog.details.timeline")}</Cell>
						</Grid>
						<Grid size={6}>
							<Cell>{t("pages.incidents.dialog.details.detailsLabel")}</Cell>
						</Grid>
						<Grid size={6}>
							<Divider />
						</Grid>
						<Grid size={6}>
							<Divider />
						</Grid>
						<Grid size={2}>
							<Cell>{t("pages.incidents.dialog.details.startedAt")}</Cell>
						</Grid>
						<Grid size={4}>
							<Cell>
								{formatDateWithTz(incident.startTime, "D MMM YYYY, h:mm A", uiTimezone)}
							</Cell>
						</Grid>
						<Grid size={2}>
							<Cell>{t("pages.incidents.dialog.details.statusCode")}</Cell>
						</Grid>
						<Grid size={4}>
							<Cell>{incident.statusCode ?? "N/A"}</Cell>
						</Grid>
						<Grid size={2}>
							<Cell>{t("pages.incidents.dialog.details.downtime")}</Cell>
						</Grid>
						<Grid size={4}>
							<Cell>{getIncidentsDuration(incident)}</Cell>
						</Grid>
						<Grid size={2}>
							<Cell>{t("pages.incidents.dialog.details.message")}</Cell>
						</Grid>
						<Grid size={4}>
							<Cell>{incident.message ?? "N/A"}</Cell>
						</Grid>
					</Grid>
				</Stack>
			</BaseBox>
			{!incident.status && (
				<BaseBox padding={LAYOUT.MD}>
					<Stack gap={theme.spacing(LAYOUT.XS)}>
						<SectionHeading>
							{t("pages.incidents.dialog.details.resolutionDetails")}
						</SectionHeading>
						<Grid
							container
							spacing={theme.spacing(LAYOUT.MD)}
							alignItems="center"
						>
							<Grid size={2}>
								<Cell>{t("pages.incidents.dialog.details.resolvedAt")}</Cell>
							</Grid>
							<Grid size={10}>
								<Cell>
									{incident.endTime
										? formatDateWithTz(incident.endTime, "D MMM YYYY, h:mm A", uiTimezone)
										: "N/A"}
								</Cell>
							</Grid>
							<Grid size={2}>
								<Cell>{t("pages.incidents.dialog.details.resolutionType")}</Cell>
							</Grid>
							<Grid size={10}>
								<Cell>
									{incident.resolutionType
										? t(
												`pages.incidents.dialog.details.resolutionTypes.${incident.resolutionType}`
											)
										: "N/A"}
								</Cell>
							</Grid>
							{incident.resolvedBy && (
								<>
									<Grid size={2}>
										<Cell>{t("pages.incidents.dialog.details.resolvedBy")}</Cell>
									</Grid>
									<Grid size={10}>
										<Cell>{incident.resolvedByEmail ?? incident.resolvedBy}</Cell>
									</Grid>
								</>
							)}
							{incident.comment && (
								<>
									<Grid size={2}>
										<Cell>{t("pages.incidents.dialog.details.comment")}</Cell>
									</Grid>
									<Grid size={10}>
										<Cell>{incident.comment}</Cell>
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

import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import { BaseBox, ValueLabel, StatusCodeLabel } from "@/Components/design-elements";
import { LAYOUT } from "@/Utils/Theme/constants";

import { useTranslation } from "react-i18next";
import type { Incident } from "@/Types/Incident";
import type { Monitor } from "@/Types/Monitor";
import { useTheme } from "@mui/material";
import { getIncidentsDuration } from "@/Pages/Incidents/utils";
import { useFormatDate } from "@/Hooks/useFormatDate";

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

// Label columns size to their longest label so labels never wrap
const DetailGrid = ({ pairs, children }: { pairs: 1 | 2; children: React.ReactNode }) => {
	const theme = useTheme();
	return (
		<Box
			display="grid"
			gridTemplateColumns={
				pairs === 2
					? "max-content minmax(0, 1fr) max-content minmax(0, 1fr)"
					: "max-content minmax(0, 1fr)"
			}
			// Baseline: a label lines up with the first line of a long, wrapping value
			alignItems="baseline"
			columnGap={theme.spacing(LAYOUT.MD)}
			rowGap={theme.spacing(LAYOUT.SM)}
		>
			{children}
		</Box>
	);
};

// Long messages are clamped; the full text is in the tooltip
const MESSAGE_MAX_LINES = 3;

const ClampedMessage = ({ text }: { text: string }) => (
	<Tooltip
		title={text}
		placement="top"
		disableInteractive
	>
		<Typography
			variant="body1"
			overflow="hidden"
			display="-webkit-box"
			sx={{
				WebkitLineClamp: MESSAGE_MAX_LINES,
				WebkitBoxOrient: "vertical",
				wordBreak: "break-word",
			}}
		>
			{text}
		</Typography>
	</Tooltip>
);

const Label = ({ children }: { children: React.ReactNode }) => (
	<Typography
		variant="body1"
		whiteSpace="nowrap"
	>
		{children}
	</Typography>
);

export const CardDetails = ({ incident, monitor, sx }: CardDetailsProps) => {
	const { t } = useTranslation();
	const theme = useTheme();
	const formatDate = useFormatDate();

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
					<DetailGrid pairs={1}>
						<Label>{t("pages.incidents.dialog.details.status")}</Label>
						<Box>
							<ValueLabel
								value={incident.status ? "negative" : "positive"}
								text={
									incident.status
										? t("common.labels.active")
										: t("common.labels.resolved")
								}
							/>
						</Box>
						{monitor && (
							<>
								<Label>{t("pages.incidents.dialog.details.monitor")}</Label>
								<Cell>{monitor.name ?? "N/A"}</Cell>
								<Label>{t("pages.incidents.dialog.details.url")}</Label>
								<Cell>{monitor.url ?? "N/A"}</Cell>
							</>
						)}
					</DetailGrid>
				</Stack>
			</BaseBox>
			<BaseBox padding={LAYOUT.MD}>
				<Stack gap={theme.spacing(LAYOUT.MD)}>
					<SectionHeading>{t("pages.incidents.dialog.details.analysis")}</SectionHeading>
					<DetailGrid pairs={2}>
						<Box gridColumn="span 2">
							<Cell>{t("pages.incidents.dialog.details.timeline")}</Cell>
						</Box>
						<Box gridColumn="span 2">
							<Cell>{t("pages.incidents.dialog.details.detailsLabel")}</Cell>
						</Box>
						<Divider sx={{ gridColumn: "span 2" }} />
						<Divider sx={{ gridColumn: "span 2" }} />
						<Label>{t("pages.incidents.dialog.details.startedAt")}</Label>
						<Cell>{formatDate(incident.startTime, "dateTime")}</Cell>
						<Label>{t("pages.incidents.dialog.details.statusCode")}</Label>
						<Box>
							<StatusCodeLabel
								statusCode={incident.statusCode}
								message={incident.message}
							/>
						</Box>
						<Label>{t("pages.incidents.dialog.details.downtime")}</Label>
						<Cell>{getIncidentsDuration(incident)}</Cell>
						<Label>{t("pages.incidents.dialog.details.message")}</Label>
						<ClampedMessage text={incident.message ?? "N/A"} />
					</DetailGrid>
				</Stack>
			</BaseBox>
			{!incident.status && (
				<BaseBox padding={LAYOUT.MD}>
					<Stack gap={theme.spacing(LAYOUT.MD)}>
						<SectionHeading>
							{t("pages.incidents.dialog.details.resolutionDetails")}
						</SectionHeading>
						<DetailGrid pairs={1}>
							<Label>{t("pages.incidents.dialog.details.resolvedAt")}</Label>
							<Cell>{formatDate(incident.endTime, "dateTime")}</Cell>
							<Label>{t("pages.incidents.dialog.details.resolutionType")}</Label>
							<Cell>
								{incident.resolutionType
									? t(
											`pages.incidents.dialog.details.resolutionTypes.${incident.resolutionType}`
										)
									: "N/A"}
							</Cell>
							{incident.resolvedBy && (
								<>
									<Label>{t("pages.incidents.dialog.details.resolvedBy")}</Label>
									<Cell>{incident.resolvedByEmail ?? incident.resolvedBy}</Cell>
								</>
							)}
							{incident.comment && (
								<>
									<Label>{t("pages.incidents.dialog.details.comment")}</Label>
									<Cell>{incident.comment}</Cell>
								</>
							)}
						</DetailGrid>
					</Stack>
				</BaseBox>
			)}
		</Stack>
	);
};

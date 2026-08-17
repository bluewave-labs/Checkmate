import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Wrench, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Monitor } from "@/Types/Monitor";
import type { ActiveMaintenanceInfo } from "@/Types/StatusPage";
import { useStatusPageTheme } from "@/Pages/StatusPage/Status/themes/StatusPageThemeProvider";
import { formatDateWithTz } from "@/Utils/TimeUtils";

interface Props {
	activeMaintenances?: ActiveMaintenanceInfo[];
	monitors: Monitor[];
	timezone?: string;
}

export const MaintenanceBanner = ({ activeMaintenances, monitors, timezone }: Props) => {
	const { t } = useTranslation();
	const { tokens, timezone: themeTimezone } = useStatusPageTheme();
	const effectiveTimezone = timezone || themeTimezone;

	if (!activeMaintenances || activeMaintenances.length === 0) {
		return null;
	}

	const monitorMap = new Map(monitors.map((m) => [m.id, m.name]));

	return (
		<Stack
			spacing={2}
			sx={{
				width: "100%",
				mb: 4,
			}}
		>
			{activeMaintenances.map((mw) => {
				const affectedNames = mw.monitorIds
					.map((id) => monitorMap.get(id))
					.filter(Boolean);

				const formattedEnd = formatDateWithTz(
					mw.end,
					"MMM D, YYYY h:mm A",
					effectiveTimezone
				);

				const etaText = t("pages.statusPages.maintenanceBanner.eta", {
					time: `${formattedEnd} (${effectiveTimezone})`,
				});

				return (
					<Box
						key={mw.id}
						sx={{
							p: 2.5,
							borderRadius: tokens.radius,
							backgroundColor: tokens.warnSoft,
							border: `1px solid ${tokens.warn}`,
							color: tokens.text,
							display: "flex",
							flexDirection: "column",
							gap: 1.5,
							boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
						}}
					>
						<Stack
							direction="row"
							alignItems="center"
							justifyContent="space-between"
							flexWrap="wrap"
							gap={1}
						>
							<Stack
								direction="row"
								alignItems="center"
								spacing={1.5}
							>
								<Box
									sx={{
										display: "inline-flex",
										alignItems: "center",
										justifyContent: "center",
										p: 0.75,
										borderRadius: "8px",
										backgroundColor: tokens.warn,
										color: "#ffffff",
									}}
								>
									<Wrench size={18} />
								</Box>
								<Typography
									variant="subtitle1"
									sx={{
										fontWeight: 600,
										fontFamily: tokens.headingFontFamily || "inherit",
										color: tokens.text,
										lineHeight: 1.2,
									}}
								>
									{mw.name || t("pages.statusPages.maintenanceBanner.title")}
								</Typography>
							</Stack>

							<Stack
								direction="row"
								alignItems="center"
								spacing={0.75}
								sx={{
									fontSize: "0.875rem",
									color: tokens.textMuted,
									backgroundColor: "rgba(0, 0, 0, 0.04)",
									px: 1.25,
									py: 0.5,
									borderRadius: "6px",
								}}
							>
								<Clock size={15} />
								<span>{etaText}</span>
							</Stack>
						</Stack>

						{affectedNames.length > 0 && (
							<Stack
								direction="row"
								alignItems="center"
								flexWrap="wrap"
								gap={0.75}
								sx={{ mt: 0.5 }}
							>
								<Typography
									variant="body2"
									sx={{
										color: tokens.textMuted,
										fontSize: "0.8125rem",
										fontWeight: 500,
									}}
								>
									{t("pages.statusPages.maintenanceBanner.affectedServices")}
								</Typography>
								{affectedNames.map((name, idx) => (
									<Box
										key={idx}
										sx={{
											fontSize: "0.75rem",
											fontWeight: 500,
											px: 1,
											py: 0.25,
											borderRadius: "4px",
											backgroundColor: tokens.surface,
											border: `1px solid ${tokens.border}`,
											color: tokens.text,
										}}
									>
										{name}
									</Box>
								))}
							</Stack>
						)}
					</Box>
				);
			})}
		</Stack>
	);
};

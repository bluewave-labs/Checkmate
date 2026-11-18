import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { LAYOUT } from "@/Utils/Theme/constants";
import { typographyLevels } from "@/Utils/Theme/Palette";

// Discord client palette (mimics the Discord embed, not the app theme).
const DISCORD_EMBED_BG = "#2b2d31";
const DISCORD_TEXT = "#dbdee1";
const DISCORD_MUTED = "#949ba4";
const DISCORD_LINK = "#00a8fc";
const DISCORD_DOWN_ACCENT = "#dc2626";

// Sample down alert, mirroring NotificationMessageBuilder.buildMonitorDownContent.
const SAMPLE_MONITOR = {
	name: "My website",
	url: "https://example.com",
	type: "http",
	status: "down",
} as const;

const renderTemplate = (template: string): string =>
	template
		.replaceAll("{{monitor_name}}", SAMPLE_MONITOR.name)
		.replaceAll("{{monitor_url}}", SAMPLE_MONITOR.url)
		.replaceAll("{{monitor_type}}", SAMPLE_MONITOR.type)
		.replaceAll("{{status}}", SAMPLE_MONITOR.status);

interface DiscordPreviewProps {
	customTitle?: string;
	customBody?: string;
	pingContent?: string;
	showMonitorUrl?: boolean;
	showDetails?: boolean;
}

const EmbedField = ({ name, value }: { name: string; value: string }) => (
	<Stack flex={1}>
		<Typography
			color={DISCORD_TEXT}
			fontWeight={600}
		>
			{name}
		</Typography>
		<Typography color={DISCORD_TEXT}>{value}</Typography>
	</Stack>
);

export const DiscordPreview = ({
	customTitle,
	customBody,
	pingContent,
	showMonitorUrl = true,
	showDetails = true,
}: DiscordPreviewProps) => {
	const theme = useTheme();
	const title =
		customTitle?.trim() !== "" && customTitle
			? renderTemplate(customTitle)
			: `Monitor Down: ${SAMPLE_MONITOR.name}`;
	const description =
		customBody?.trim() !== "" && customBody
			? renderTemplate(customBody)
			: `Monitor "${SAMPLE_MONITOR.name}" is currently down and unreachable.`;
	const details = showDetails
		? [
				`URL: ${SAMPLE_MONITOR.url}`,
				"Status: Down",
				`Type: ${SAMPLE_MONITOR.type}`,
			].filter((detail) => showMonitorUrl || !detail.startsWith("URL:"))
		: [];
	const timestamp = `Today at ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
	const ping = pingContent?.trim() ? renderTemplate(pingContent) : undefined;

	return (
		<Stack spacing={theme.spacing(LAYOUT.XS)}>
			{ping && <Typography color={DISCORD_TEXT}>{ping}</Typography>}
			<Stack
				direction="row"
				bgcolor={DISCORD_EMBED_BG}
				borderRadius={theme.shape.borderRadius}
				overflow="hidden"
			>
				<Box
					width={LAYOUT.XS}
					bgcolor={DISCORD_DOWN_ACCENT}
				/>
				<Stack
					flex={1}
					p={theme.spacing(LAYOUT.MD)}
					spacing={theme.spacing(LAYOUT.XS)}
				>
					<Typography
						color={DISCORD_TEXT}
						fontSize={typographyLevels.l}
						fontWeight={600}
					>
						{title}
					</Typography>
					<Typography color={DISCORD_TEXT}>{description}</Typography>
					<Stack direction="row">
						<EmbedField
							name="Monitor"
							value={SAMPLE_MONITOR.name}
						/>
						<EmbedField
							name="Type"
							value={SAMPLE_MONITOR.type.toUpperCase()}
						/>
						<EmbedField
							name="Status"
							value="Down"
						/>
					</Stack>
					{showMonitorUrl && (
						<Stack>
							<Typography
								color={DISCORD_TEXT}
								fontWeight={600}
							>
								URL
							</Typography>
							<Typography color={DISCORD_LINK}>{SAMPLE_MONITOR.url}</Typography>
						</Stack>
					)}
					{details.length > 0 && (
						<Stack>
							<Typography
								color={DISCORD_TEXT}
								fontWeight={600}
							>
								Details
							</Typography>
							{details.map((detail) => (
								<Typography
									key={detail}
									color={DISCORD_TEXT}
								>
									{detail}
								</Typography>
							))}
						</Stack>
					)}
					<Typography
						color={DISCORD_MUTED}
						fontSize={typographyLevels.s}
					>
						{timestamp}
					</Typography>
				</Stack>
			</Stack>
		</Stack>
	);
};

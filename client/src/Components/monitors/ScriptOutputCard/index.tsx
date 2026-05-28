import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	Box,
	Chip,
	Collapse,
	IconButton,
	Stack,
	Typography,
	useTheme,
} from "@mui/material";
import { ChevronDown, ChevronUp } from "lucide-react";
import { LAYOUT } from "@/Utils/Theme/constants";

// Severity → palette colour mapping. Defined at module scope so the
// component does not allocate it per render.
const SEVERITY_LABELS: Record<string, string> = {
	success: "Success",
	info: "Info",
	warning: "Warning",
	error: "Error",
	critical: "Critical",
};

interface ParsedDatapoint {
	name: string;
	value: number;
	unit?: string;
}

interface ScriptCheckMessage {
	stdout?: string;
	stderr?: string;
	exitCode?: number;
	executionTimeMs?: number;
	timedOut?: boolean;
	parsedStatus?: string;
	parsedTarget?: string;
	parsedMessage?: string;
	severity?: string;
	datapoints?: ParsedDatapoint[];
}

interface ScriptOutputCardProps {
	checkMessage: string | undefined;
}

// ScriptOutputCard renders the JSON payload that the ScriptProvider stores
// in `check.message`. It is defensive: if the payload cannot be parsed it
// degrades to the raw string so operators still see something useful.
const ScriptOutputCard = ({ checkMessage }: ScriptOutputCardProps) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const [rawOpen, setRawOpen] = useState(false);

	const parsed = useMemo<ScriptCheckMessage | null>(() => {
		if (!checkMessage) return null;
		try {
			return JSON.parse(checkMessage) as ScriptCheckMessage;
		} catch {
			return null;
		}
	}, [checkMessage]);

	const severityColour = (severity?: string): string => {
		switch (severity) {
			case "success":
				return theme.palette.success.main;
			case "info":
				return theme.palette.info.main;
			case "warning":
				return theme.palette.warning.main;
			case "error":
				return theme.palette.error.main;
			case "critical":
				return theme.palette.error.dark;
			default:
				return theme.palette.text.secondary;
		}
	};

	if (!parsed) {
		return (
			<Box
				p={theme.spacing(LAYOUT.MD)}
				borderRadius={theme.shape.borderRadius}
				bgcolor={theme.palette.background.paper}
			>
				<Typography
					variant="body2"
					fontFamily={theme.typography.fontFamilyMonospace}
					whiteSpace="pre-wrap"
				>
					{checkMessage ??
						t("pages.scriptMonitor.details.noOutput", "No output captured.")}
				</Typography>
			</Box>
		);
	}

	const messageText = (parsed.parsedMessage ?? "").replace(/<br\s*\/?>/gi, "\n");

	return (
		<Box
			p={theme.spacing(LAYOUT.MD)}
			borderRadius={theme.shape.borderRadius}
			bgcolor={theme.palette.background.paper}
		>
			<Stack spacing={theme.spacing(LAYOUT.SM)}>
				<Stack
					direction="row"
					alignItems="center"
					spacing={theme.spacing(LAYOUT.XS)}
				>
					<Chip
						size="small"
						label={SEVERITY_LABELS[parsed.severity ?? ""] ?? parsed.severity ?? "Unknown"}
						sx={{ backgroundColor: severityColour(parsed.severity), color: "#fff" }}
					/>
					{parsed.parsedTarget && (
						<Typography
							variant="body2"
							color={theme.palette.text.secondary}
						>
							{t("pages.scriptMonitor.details.target", "Target")}: {parsed.parsedTarget}
						</Typography>
					)}
				</Stack>

				{messageText.length > 0 && (
					<Typography
						variant="body1"
						whiteSpace="pre-line"
					>
						{messageText}
					</Typography>
				)}

				<Stack
					direction={{ xs: "column", md: "row" }}
					spacing={theme.spacing(LAYOUT.MD)}
				>
					<Typography
						variant="body2"
						color={theme.palette.text.secondary}
					>
						{t("pages.scriptMonitor.details.exitCode", "Exit code")}:{" "}
						<Box
							component="span"
							fontFamily={theme.typography.fontFamilyMonospace}
						>
							{parsed.exitCode ?? "—"}
						</Box>
					</Typography>
					<Typography
						variant="body2"
						color={theme.palette.text.secondary}
					>
						{t("pages.scriptMonitor.details.duration", "Duration")}:{" "}
						<Box
							component="span"
							fontFamily={theme.typography.fontFamilyMonospace}
						>
							{parsed.executionTimeMs ?? 0} ms
						</Box>
					</Typography>
					{parsed.timedOut && (
						<Typography
							variant="body2"
							color={theme.palette.error.main}
						>
							{t("pages.scriptMonitor.details.timedOut", "Timed out")}
						</Typography>
					)}
				</Stack>

				<Stack
					direction="row"
					alignItems="center"
				>
					<IconButton
						size="small"
						onClick={() => setRawOpen((v) => !v)}
						aria-label={
							t("pages.scriptMonitor.details.toggleRaw", "Toggle raw output") as string
						}
					>
						{rawOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
					</IconButton>
					<Typography
						variant="body2"
						color={theme.palette.text.secondary}
					>
						{t("pages.scriptMonitor.details.rawOutput", "Raw output")}
					</Typography>
				</Stack>
				<Collapse in={rawOpen}>
					<Box
						p={theme.spacing(LAYOUT.SM)}
						borderRadius={theme.shape.borderRadius}
						bgcolor={theme.palette.action.hover}
					>
						<Typography
							component="pre"
							variant="body2"
							fontFamily={theme.typography.fontFamilyMonospace}
							whiteSpace="pre-wrap"
							margin={0}
						>
							{parsed.stdout || t("pages.scriptMonitor.details.noStdout", "(no stdout)")}
						</Typography>
						{parsed.stderr && parsed.stderr.length > 0 && (
							<Typography
								component="pre"
								variant="body2"
								color={theme.palette.error.main}
								fontFamily={theme.typography.fontFamilyMonospace}
								whiteSpace="pre-wrap"
								margin={0}
								mt={theme.spacing(LAYOUT.SM)}
							>
								{parsed.stderr}
							</Typography>
						)}
					</Box>
				</Collapse>
			</Stack>
		</Box>
	);
};

export default ScriptOutputCard;
export type { ScriptCheckMessage, ParsedDatapoint };

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { ConfigBox, CopyRow, TextLink } from "@/Components/design-elements";
import { BASE_URL } from "@/Utils/ApiClient";
import { LAYOUT } from "@/Utils/Theme/constants";

const CURL = "curl -fsS -m 10 --retry 3";
// The plaintext key is only shown once, in Settings, so the URL carries a placeholder for it
const PING_KEY_PLACEHOLDER = "<pingKey>";

const HeartbeatExamples = ["post", "cron", "exitCode", "fail", "duration"] as const;
type HeartbeatExample = (typeof HeartbeatExamples)[number];

// No request body: a malformed JSON body is rejected by the server before the ping is recorded
const buildExample: Record<HeartbeatExample, (url: string) => string> = {
	post: (url) => `${CURL} -X POST ${url}`,
	cron: (url) => `0 * * * * /path/to/job.sh && ${CURL} ${url}`,
	exitCode: (url) => `/path/to/job.sh; ${CURL} ${url}/$?`,
	fail: (url) => `${CURL} ${url}/fail`,
	// Whole seconds via `date +%s` so it runs under both GNU and BSD date; the server takes milliseconds
	// CODE=$? captures the job's exit code before `date` overwrites $?
	duration: (url) =>
		`START=$(date +%s); /path/to/job.sh; CODE=$?; ${CURL} "${url}/$CODE?duration=$((($(date +%s) - START) * 1000))"`,
};

const HeartbeatOptions = ["fail", "exitCode", "duration", "msg"] as const;
type HeartbeatOption = (typeof HeartbeatOptions)[number];

const optionSyntax: Record<HeartbeatOption, string> = {
	fail: "/fail",
	exitCode: "/<code>",
	duration: "?duration=<ms>",
	msg: "?msg=<text>",
};

interface HeartbeatUrlPanelProps {
	slug: string;
}

export const HeartbeatUrlPanel = ({ slug }: HeartbeatUrlPanelProps) => {
	const theme = useTheme();
	const { t } = useTranslation();

	// Only the base goes through URL: it would percent-encode the placeholder's < and >
	const apiBase = new URL(BASE_URL, window.location.origin).toString().replace(/\/$/, "");
	const pingUrl = `${apiBase}/heartbeat/${PING_KEY_PLACEHOLDER}/${slug}`;

	return (
		<ConfigBox
			title={t("pages.uptime.details.heartbeat.title")}
			subtitle={t("pages.uptime.details.heartbeat.description")}
			leftContent={
				<Stack gap={theme.spacing(LAYOUT.MD)}>
					<Typography variant="h2">
						{t("pages.uptime.details.heartbeat.options.title")}
					</Typography>
					<Typography color={theme.palette.text.secondary}>
						{t("pages.uptime.details.heartbeat.options.description")}
					</Typography>
					{HeartbeatOptions.map((option) => (
						<Typography key={option}>
							<Box
								component="code"
								fontFamily={theme.typography.fontFamilyMonospace}
							>
								{optionSyntax[option]}
							</Box>{" "}
							{t(`pages.uptime.details.heartbeat.options.${option}`)}
						</Typography>
					))}
					<Typography color={theme.palette.text.secondary}>
						{t("pages.uptime.details.heartbeat.options.combine")}
					</Typography>
					<TextLink
						text={t("pages.uptime.details.heartbeat.keyHint")}
						linkText={t("pages.uptime.details.heartbeat.keyLink")}
						href="/settings?tab=monitoring"
					/>
				</Stack>
			}
			rightContent={
				<Stack spacing={theme.spacing(LAYOUT.MD)}>
					<CopyRow
						label={t("pages.uptime.details.heartbeat.pingUrl")}
						value={pingUrl}
					/>
					<Stack gap={theme.spacing(LAYOUT.XS)}>
						<Typography variant="h2">
							{t("pages.uptime.details.heartbeat.examplesTitle")}
						</Typography>
						<Typography color={theme.palette.text.secondary}>
							{t("pages.uptime.details.heartbeat.examplesDescription")}
						</Typography>
					</Stack>
					{HeartbeatExamples.map((example) => (
						<CopyRow
							key={example}
							label={t(`pages.uptime.details.heartbeat.examples.${example}`)}
							value={buildExample[example](pingUrl)}
						/>
					))}
				</Stack>
			}
		/>
	);
};

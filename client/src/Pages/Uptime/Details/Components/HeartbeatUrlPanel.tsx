import { useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { Copy, RefreshCw } from "lucide-react";
import { CodeBlock, ConfigBox, Icon } from "@/Components/design-elements";
import { Button, Dialog } from "@/Components/inputs";
import { useGet, usePost } from "@/Hooks/UseApi";
import { useToast } from "@/Hooks/UseToast";
import { BASE_URL } from "@/Utils/ApiClient";
import { LAYOUT } from "@/Utils/Theme/constants";
import type { HeartbeatTokenResponse } from "@/Types/Monitor";

const CURL = "curl -fsS -m 10 --retry 3";

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

const CopyRow = ({ label, value }: { label: string; value: string }) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const { toastSuccess, toastError } = useToast();

	// navigator.clipboard is undefined on plain-HTTP origins; the catch covers it
	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(value);
			toastSuccess(t("pages.uptime.details.heartbeat.copied"));
		} catch {
			toastError(t("pages.uptime.details.heartbeat.copyFailed"));
		}
	};

	return (
		<Stack gap={theme.spacing(LAYOUT.XS)}>
			<Typography color={theme.palette.text.secondary}>{label}</Typography>
			<Stack
				direction="row"
				alignItems="center"
				gap={theme.spacing(LAYOUT.XS)}
			>
				<Box
					flex={1}
					minWidth={0}
				>
					<CodeBlock wrap>{value}</CodeBlock>
				</Box>
				<IconButton
					size="small"
					onClick={handleCopy}
					aria-label={t("pages.uptime.details.heartbeat.copy")}
				>
					<Icon icon={Copy} />
				</IconButton>
			</Stack>
		</Stack>
	);
};

// Rendered for admins only (the token endpoint is admin/superadmin)
interface HeartbeatUrlPanelProps {
	monitorId: string;
}

export const HeartbeatUrlPanel = ({ monitorId }: HeartbeatUrlPanelProps) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const [isRotateDialogOpen, setIsRotateDialogOpen] = useState(false);
	const tokenUrl = `/monitors/${monitorId}/heartbeat-token`;
	const { data, refetch } = useGet<HeartbeatTokenResponse>(tokenUrl);
	const { post, loading: isRotating } = usePost<
		Record<string, never>,
		HeartbeatTokenResponse
	>();

	if (!data?.heartbeatToken) {
		return null;
	}

	const pingUrl = new URL(
		`${BASE_URL}/heartbeat/${data.heartbeatToken}`,
		window.location.origin
	).toString();

	const handleRotateConfirm = async () => {
		const result = await post(tokenUrl, {});
		setIsRotateDialogOpen(false);
		if (result?.success) {
			await refetch();
		}
	};

	return (
		<>
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
						<Box>
							<Button
								variant="contained"
								color="secondary"
								startIcon={<Icon icon={RefreshCw} />}
								onClick={() => setIsRotateDialogOpen(true)}
							>
								{t("pages.uptime.details.heartbeat.rotate")}
							</Button>
						</Box>
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
			<Dialog
				open={isRotateDialogOpen}
				title={t("pages.uptime.details.heartbeat.rotateConfirmTitle")}
				content={t("pages.uptime.details.heartbeat.rotateConfirmBody")}
				confirmText={t("pages.uptime.details.heartbeat.rotate")}
				confirmColor="error"
				onConfirm={handleRotateConfirm}
				onCancel={() => setIsRotateDialogOpen(false)}
				loading={isRotating}
			/>
		</>
	);
};

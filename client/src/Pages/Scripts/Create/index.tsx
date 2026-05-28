import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	Box,
	Grid,
	IconButton,
	Stack,
	Tab,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Tabs,
	Typography,
	useTheme,
} from "@mui/material";
import { ChevronDown, Code, Copy, Plus, Terminal, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { BasePage } from "@/Components/design-elements";
import { Button, TextField, ToggleButton, ToggleButtonGroup } from "@/Components/inputs";
import { ScriptRuntimes, type ScriptRuntime, type Script } from "@/Types/Monitor";
import { useGet, usePost, usePut } from "@/Hooks/UseApi";
import { LAYOUT } from "@/Utils/Theme/constants";

interface ParameterRow {
	key: string;
	value: string;
}

const toRows = (record: Record<string, string> | undefined): ParameterRow[] => {
	if (!record) return [];
	return Object.entries(record).map(([key, value]) => ({ key, value }));
};

const toRecord = (rows: ParameterRow[]): Record<string, string> => {
	const out: Record<string, string> = {};
	for (const row of rows) {
		if (row.key.trim().length === 0) continue;
		out[row.key.trim()] = row.value;
	}
	return out;
};

const VARIABLES: Array<{ key: string; description: string }> = [
	{ key: "%%devicename%%", description: "Device or monitor name" },
	{ key: "%%hostname%%", description: "Target hostname" },
	{ key: "%%ip%%", description: "Target IP address" },
	{ key: "%%datetime%%", description: "Current UTC timestamp" },
	{ key: "%%captureagent%%", description: "Capture agent URL" },
	{ key: "%%runtime%%", description: "Script runtime" },
	{ key: "%%teamname%%", description: "Team name" },
];

const OUTPUT_FORMAT_EXAMPLE = `Success(%%devicename%%)=All checks passed
Info(%%devicename%%)=Service is running
Warning(%%devicename%%)=CPU usage is high
Error(%%devicename%%)=Service is down
Critical(%%devicename%%)=System failure detected`;

const DATAPOINT_EXAMPLE = `Datapoint(cpu_pct)=72.3
Datapoint(disk_free_gb)=120.4 GB`;

const TEMPLATES: Record<ScriptRuntime, string> = {
	bash: `#!/bin/bash
# Disk usage check
USAGE=$(df -h / | awk 'NR==2{print $5}' | tr -d '%')
if [ "$USAGE" -gt 90 ]; then
  echo "Critical(%%devicename%%)=Disk usage is \${USAGE}%"
elif [ "$USAGE" -gt 80 ]; then
  echo "Warning(%%devicename%%)=Disk usage is \${USAGE}%"
else
  echo "Success(%%devicename%%)=Disk usage is \${USAGE}%"
fi
echo "Datapoint(disk_pct)=\${USAGE}"
`,
	python: `import sys, urllib.request
try:
    req = urllib.request.urlopen("https://%%hostname%%", timeout=5)
    ms = 42  # measure actual response time if needed
    print(f"Success(%%devicename%%)=HTTP {req.status} in {ms}ms")
    print(f"Datapoint(response_ms)={ms}")
except Exception as e:
    print(f"Error(%%devicename%%)=Request failed: {e}")
    sys.exit(1)
`,
	powershell: `$service = "wuauserv"
$svc = Get-Service -Name $service -ErrorAction SilentlyContinue
if ($svc -and $svc.Status -eq "Running") {
    Write-Output "Success(%%devicename%%)=Service $service is running"
} else {
    Write-Output "Error(%%devicename%%)=Service $service is not running"
    exit 1
}
`,
};

const CreateScriptPage = () => {
	const { t } = useTranslation();
	const theme = useTheme();
	const navigate = useNavigate();
	const { scriptId } = useParams<{ scriptId?: string }>();
	const isEdit = Boolean(scriptId);

	const { data: existing } = useGet<Script>(isEdit ? `/scripts/${scriptId}` : null, {});

	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [runtime, setRuntime] = useState<ScriptRuntime>("bash");
	const [body, setBody] = useState("");
	const [params, setParams] = useState<ParameterRow[]>([]);
	const [templateTab, setTemplateTab] = useState<ScriptRuntime>("bash");

	useEffect(() => {
		if (!existing) return;
		setName(existing.name ?? "");
		setDescription(existing.description ?? "");
		setRuntime(existing.runtime ?? "bash");
		setBody(existing.body ?? "");
		setParams(toRows(existing.parameters));
	}, [existing]);

	const { post, loading: posting } = usePost();
	const { put, loading: putting } = usePut();

	const handleAddParam = () => setParams((prev) => [...prev, { key: "", value: "" }]);
	const handleRemoveParam = (idx: number) =>
		setParams((prev) => prev.filter((_, i) => i !== idx));
	const handleParamKeyChange = (idx: number, key: string) =>
		setParams((prev) => prev.map((p, i) => (i === idx ? { ...p, key } : p)));
	const handleParamValueChange = (idx: number, value: string) =>
		setParams((prev) => prev.map((p, i) => (i === idx ? { ...p, value } : p)));

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		const payload = {
			name: name.trim(),
			description: description.trim() || undefined,
			runtime,
			body,
			parameters: toRecord(params),
		};
		const res = isEdit
			? await put(`/scripts/${scriptId}`, payload)
			: await post("/scripts", payload);
		if (res?.success) {
			navigate("/scripts");
		}
	};

	const copyToClipboard = (text: string) => {
		if (typeof navigator !== "undefined" && navigator.clipboard) {
			navigator.clipboard.writeText(text).catch(() => undefined);
		}
	};

	const useTemplate = () => {
		setBody(TEMPLATES[templateTab]);
		setRuntime(templateTab);
	};

	const codeBoxSx = useMemo(
		() => ({
			backgroundColor: theme.palette.grey[900],
			color: theme.palette.common.white,
			fontFamily: theme.typography.fontFamilyMonospace,
			padding: theme.spacing(LAYOUT.MD),
			borderRadius: theme.shape.borderRadius,
			overflow: "auto",
			whiteSpace: "pre",
			fontSize: "0.85rem",
		}),
		[theme]
	);

	return (
		<BasePage
			component="form"
			onSubmit={handleSubmit}
		>
			<Grid
				container
				spacing={3}
			>
				<Grid size={{ xs: 12, md: 8 }}>
					<Stack spacing={theme.spacing(LAYOUT.MD)}>
						<Typography
							variant="h4"
							color={theme.palette.text.primary}
						>
							{isEdit
								? t("pages.scripts.create.editTitle", "Edit script")
								: t("pages.scripts.create.title", "Create script")}
						</Typography>

						<TextField
							fieldLabel={t("pages.scripts.create.name", "Name")}
							value={name}
							onChange={(e) => setName(e.target.value)}
							required
							inputProps={{ maxLength: 128 }}
							fullWidth
						/>
						<TextField
							fieldLabel={t("pages.scripts.create.description", "Description")}
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							multiline
							minRows={2}
							fullWidth
						/>

						<Box>
							<Typography
								variant="subtitle1"
								color={theme.palette.text.primary}
								mb={1}
							>
								{t("pages.scripts.create.runtime", "Runtime")}
							</Typography>
							<ToggleButtonGroup
								value={runtime}
								exclusive
								onChange={(_, value) => {
									if (value) setRuntime(value as ScriptRuntime);
								}}
								color="primary"
							>
								{ScriptRuntimes.map((r) => (
									<ToggleButton
										key={r}
										value={r}
									>
										<Stack
											direction="row"
											alignItems="center"
											spacing={theme.spacing(LAYOUT.XS)}
										>
											<Terminal size={14} />
											<span>
												{r === "bash"
													? t("pages.scripts.create.runtimes.bash", "Bash")
													: r === "python"
														? t("pages.scripts.create.runtimes.python", "Python")
														: t("pages.scripts.create.runtimes.powershell", "PowerShell")}
											</span>
										</Stack>
									</ToggleButton>
								))}
							</ToggleButtonGroup>
						</Box>

						<TextField
							fieldLabel={t("pages.scripts.create.body", "Script body")}
							value={body}
							onChange={(e) => setBody(e.target.value)}
							multiline
							minRows={18}
							fullWidth
							inputProps={{
								style: {
									fontFamily: theme.typography.fontFamilyMonospace,
								},
							}}
						/>

						<Box>
							<Stack
								direction="row"
								alignItems="center"
								justifyContent="space-between"
								mb={1}
							>
								<Typography
									variant="subtitle1"
									color={theme.palette.text.primary}
								>
									{t("pages.scripts.create.parameters", "Default parameters")}
								</Typography>
								<Button
									startIcon={<Plus size={16} />}
									onClick={handleAddParam}
									size="small"
								>
									{t("pages.scripts.create.addParameter", "Add parameter")}
								</Button>
							</Stack>
							<Stack spacing={1}>
								{params.map((row, idx) => (
									<Stack
										key={idx}
										direction="row"
										spacing={1}
									>
										<TextField
											fieldLabel={t("pages.scripts.create.parameterKey", "Key")}
											value={row.key}
											onChange={(e) => handleParamKeyChange(idx, e.target.value)}
											size="small"
										/>
										<TextField
											fieldLabel={t("pages.scripts.create.parameterValue", "Value")}
											value={row.value}
											onChange={(e) => handleParamValueChange(idx, e.target.value)}
											size="small"
											fullWidth
										/>
										<IconButton
											onClick={() => handleRemoveParam(idx)}
											aria-label={t("common.actions.delete", "Delete") as string}
										>
											<Trash2 size={16} />
										</IconButton>
									</Stack>
								))}
							</Stack>
						</Box>

						<Stack
							direction="row"
							spacing={theme.spacing(LAYOUT.XS)}
							justifyContent="flex-end"
						>
							<Button
								variant="outlined"
								onClick={() => navigate("/scripts")}
							>
								{t("common.actions.cancel", "Cancel")}
							</Button>
							<Button
								type="submit"
								variant="contained"
								loading={posting || putting}
								disabled={!name.trim() || !body.trim()}
							>
								{isEdit
									? t("common.actions.save", "Save")
									: t("common.actions.create", "Create")}
							</Button>
						</Stack>
					</Stack>
				</Grid>

				<Grid size={{ xs: 12, md: 4 }}>
					<Stack spacing={theme.spacing(LAYOUT.MD)}>
						<Accordion defaultExpanded>
							<AccordionSummary expandIcon={<ChevronDown size={16} />}>
								<Typography
									variant="subtitle1"
									color={theme.palette.text.primary}
								>
									{t("pages.scripts.create.help.outputFormat.title", "Output format")}
								</Typography>
							</AccordionSummary>
							<AccordionDetails>
								<Typography
									variant="body2"
									color={theme.palette.text.secondary}
									mb={theme.spacing(LAYOUT.SM)}
								>
									{t(
										"pages.scripts.create.help.outputFormat.description",
										"Emit one of these status lines to set monitor state."
									)}
								</Typography>
								<Box sx={codeBoxSx}>{OUTPUT_FORMAT_EXAMPLE}</Box>
								<Box mt={theme.spacing(LAYOUT.XS)}>
									<IconButton
										size="small"
										onClick={() => copyToClipboard(OUTPUT_FORMAT_EXAMPLE)}
										aria-label={t("common.actions.copy", "Copy") as string}
									>
										<Copy size={14} />
									</IconButton>
								</Box>
							</AccordionDetails>
						</Accordion>

						<Accordion defaultExpanded>
							<AccordionSummary expandIcon={<ChevronDown size={16} />}>
								<Typography
									variant="subtitle1"
									color={theme.palette.text.primary}
								>
									{t("pages.scripts.create.help.variables.title", "Available variables")}
								</Typography>
							</AccordionSummary>
							<AccordionDetails>
								<TableContainer>
									<Table size="small">
										<TableHead>
											<TableRow>
												<TableCell>
													{t(
														"pages.scripts.create.help.variables.columnVariable",
														"Variable"
													)}
												</TableCell>
												<TableCell>
													{t(
														"pages.scripts.create.help.variables.columnDescription",
														"Description"
													)}
												</TableCell>
											</TableRow>
										</TableHead>
										<TableBody>
											{VARIABLES.map((variable) => (
												<TableRow key={variable.key}>
													<TableCell
														sx={{ fontFamily: theme.typography.fontFamilyMonospace }}
													>
														{variable.key}
													</TableCell>
													<TableCell>{variable.description}</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</TableContainer>
							</AccordionDetails>
						</Accordion>

						<Accordion>
							<AccordionSummary expandIcon={<ChevronDown size={16} />}>
								<Typography
									variant="subtitle1"
									color={theme.palette.text.primary}
								>
									{t("pages.scripts.create.help.datapoints.title", "Tracking datapoints")}
								</Typography>
							</AccordionSummary>
							<AccordionDetails>
								<Typography
									variant="body2"
									color={theme.palette.text.secondary}
									mb={theme.spacing(LAYOUT.SM)}
								>
									{t(
										"pages.scripts.create.help.datapoints.description",
										"Add numeric values to track over time as sparkline charts."
									)}
								</Typography>
								<Box sx={codeBoxSx}>{DATAPOINT_EXAMPLE}</Box>
							</AccordionDetails>
						</Accordion>

						<Accordion>
							<AccordionSummary expandIcon={<ChevronDown size={16} />}>
								<Typography
									variant="subtitle1"
									color={theme.palette.text.primary}
								>
									<Stack
										direction="row"
										alignItems="center"
										spacing={theme.spacing(LAYOUT.XS)}
									>
										<Code size={16} />
										<span>
											{t("pages.scripts.create.help.examples.title", "Example scripts")}
										</span>
									</Stack>
								</Typography>
							</AccordionSummary>
							<AccordionDetails>
								<Tabs
									value={templateTab}
									onChange={(_, value) => setTemplateTab(value as ScriptRuntime)}
								>
									<Tab
										label={t("pages.scripts.create.runtimes.bash", "Bash")}
										value="bash"
									/>
									<Tab
										label={t("pages.scripts.create.runtimes.python", "Python")}
										value="python"
									/>
									<Tab
										label={t("pages.scripts.create.runtimes.powershell", "PowerShell")}
										value="powershell"
									/>
								</Tabs>
								<Box
									mt={theme.spacing(LAYOUT.SM)}
									sx={codeBoxSx}
								>
									{TEMPLATES[templateTab]}
								</Box>
								<Box mt={theme.spacing(LAYOUT.XS)}>
									<Button
										variant="outlined"
										size="small"
										onClick={useTemplate}
									>
										{t("pages.scripts.create.help.examples.use", "Use this template")}
									</Button>
								</Box>
							</AccordionDetails>
						</Accordion>
					</Stack>
				</Grid>
			</Grid>
		</BasePage>
	);
};

export default CreateScriptPage;

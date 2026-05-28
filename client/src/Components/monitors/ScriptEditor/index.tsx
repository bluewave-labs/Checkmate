// ScriptEditor renders a monospace, full-width textarea for editing
// script bodies. We deliberately avoid pulling in Monaco / CodeMirror
// here so the bundle size stays small; consumers can swap this for a
// richer editor later if needed.
//
// Props mirror the `@monaco-editor/react` shape so a future drop-in
// replacement (e.g. when the team installs Monaco) does not require a
// caller-side change.

import { TextField, Box, useTheme } from "@mui/material";
import type { ChangeEvent } from "react";
import type { ScriptRuntime } from "@/Types/Monitor";

interface ScriptEditorProps {
	value: string;
	onChange: (value: string) => void;
	runtime: ScriptRuntime;
	readonly?: boolean;
	rows?: number;
	"data-testid"?: string;
}

const ScriptEditor = ({ value, onChange, runtime, readonly, rows = 16, "data-testid": testId }: ScriptEditorProps) => {
	const theme = useTheme();
	const placeholder =
		runtime === "powershell"
			? "Write-Output 'hello world'"
			: runtime === "python"
				? "print('hello world')"
				: "echo 'hello world'";

	const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		onChange(e.target.value);
	};

	return (
		<Box width="100%">
			<TextField
				fullWidth
				multiline
				minRows={rows}
				maxRows={rows + 8}
				value={value}
				onChange={handleChange}
				placeholder={placeholder}
				disabled={readonly}
				slotProps={{
					htmlInput: {
						style: {
							fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
							fontSize: 13,
							lineHeight: 1.5,
							color: theme.palette.text.primary,
						},
						spellCheck: false,
						"data-testid": testId,
					},
				}}
				sx={{
					"& .MuiInputBase-root": {
						bgcolor: theme.palette.background.default,
						borderRadius: theme.shape.borderRadius,
					},
				}}
			/>
		</Box>
	);
};

export default ScriptEditor;

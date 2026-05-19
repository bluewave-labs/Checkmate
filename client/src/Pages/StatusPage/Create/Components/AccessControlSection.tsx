import { useEffect, useState } from "react";
import { Controller, type Control, type FieldValues, type UseFormSetValue } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material/styles";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";

import { TextField } from "@/Components/inputs";
import SwitchComponent from "@mui/material/Switch";
import { LAYOUT } from "@/Utils/Theme/constants";
import { typographyLevels } from "@/Utils/Theme/Palette";

interface Props {
	control: Control<FieldValues>;
	setValue: UseFormSetValue<FieldValues>;
	hasExistingPassword: boolean;
}

export const AccessControlSection = ({ control, setValue, hasExistingPassword }: Props) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const [enabled, setEnabled] = useState<boolean>(hasExistingPassword);

	// hasExistingPassword flips when the parent re-fetches after a save
	// (e.g. password just removed → false). useState initialises only once,
	// so without this sync the switch keeps showing the pre-save state.
	useEffect(() => {
		setEnabled(hasExistingPassword);
	}, [hasExistingPassword]);

	const handleSwitchChange = (v: boolean) => {
		setEnabled(v);
		if (hasExistingPassword) {
			// Toggling off on a page that already has a password is a removal intent;
			// toggling back on cancels that removal. Without this, the switch was
			// decorative — the form would still ship the old password unchanged.
			setValue("removePassword", !v, { shouldDirty: true });
		}
		if (!v) {
			setValue("password", "", { shouldDirty: true });
		}
	};

	return (
		<Stack gap={theme.spacing(LAYOUT.MD)}>
			<Typography
				variant="h2"
				fontSize={typographyLevels.l}
				color={theme.palette.text.primary}
			>
				{t("pages.statusPages.accessControl.sectionTitle")}
			</Typography>

			<Stack direction="row" alignItems="center" gap={theme.spacing(LAYOUT.SM)}>
				<SwitchComponent
					checked={enabled}
					onChange={(_e, v) => handleSwitchChange(v)}
				/>
				<Typography color={theme.palette.text.primary}>
					{t("pages.statusPages.accessControl.requirePassword")}
				</Typography>
			</Stack>

			{enabled && (
				<Stack gap={theme.spacing(LAYOUT.SM)}>
					<Controller
						name="password"
						control={control}
						render={({ field, fieldState }) => (
							<TextField
								{...field}
								type="password"
								placeholder={
									hasExistingPassword
										? t("pages.statusPages.accessControl.passwordPlaceholderExisting")
										: t("pages.statusPages.accessControl.passwordPlaceholder")
								}
								error={Boolean(fieldState.error)}
								helperText={
									fieldState.error?.message ??
									t("pages.statusPages.accessControl.helperText")
								}
								fullWidth
							/>
						)}
					/>
					{hasExistingPassword && (
						<Controller
							name="removePassword"
							control={control}
							render={({ field }) => (
								<Link
									component="button"
									type="button"
									color={theme.palette.error.main}
									onClick={() => field.onChange(!field.value)}
									fontSize={typographyLevels.s}
								>
									{field.value
										? t("common.buttons.cancel")
										: t("pages.statusPages.accessControl.removePassword")}
								</Link>
							)}
						/>
					)}
				</Stack>
			)}
		</Stack>
	);
};

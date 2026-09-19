import MenuItem from "@mui/material/MenuItem";
import FormHelperText from "@mui/material/FormHelperText";
import { useController } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Select } from "@/Components/inputs";
import { INVITE_DURATION_OPTIONS } from "@/Utils/inviteDurationOptions";

export const DurationSelectField = () => {
	const { t } = useTranslation();
	const { field, fieldState } = useController<
		{ expiresInHours: number },
		"expiresInHours"
	>({
		name: "expiresInHours",
	});

	return (
		<>
			<Select
				{...field}
				onChange={(e) => field.onChange(Number(e.target.value))}
				fieldLabel={t("pages.account.team.invites.durationLabel")}
				fullWidth
				error={!!fieldState.error}
			>
				{INVITE_DURATION_OPTIONS.map((option) => (
					<MenuItem
						key={option.hours}
						value={option.hours}
					>
						{t(`pages.account.team.invites.durations.${option.labelKey}`)}
					</MenuItem>
				))}
			</Select>
			{fieldState.error && (
				<FormHelperText error>{fieldState.error.message}</FormHelperText>
			)}
		</>
	);
};

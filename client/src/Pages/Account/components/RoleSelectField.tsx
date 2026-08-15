import MenuItem from "@mui/material/MenuItem";
import FormHelperText from "@mui/material/FormHelperText";
import { useController } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Select } from "@/Components/inputs";
import { UserRoles } from "@/Types/User";
import type { UserRole } from "@/Types/User";

export const RoleSelectField = () => {
	const { t } = useTranslation();
	const { field, fieldState } = useController<{ role: UserRole[] }, "role">({
		name: "role",
	});

	const editableRoles = UserRoles.filter((role) => role !== "superadmin");
	const roleOptions: { value: UserRole; label: string }[] = editableRoles.map((role) => ({
		value: role,
		label: t(`common.auth.roles.${role}`),
	}));

	return (
		<>
			<Select
				{...field}
				value={field.value[0] ?? "user"}
				onChange={(e) => field.onChange([e.target.value])}
				fieldLabel={t("common.form.role.option.role.label")}
				fullWidth
				error={!!fieldState.error}
			>
				{roleOptions.map((option) => (
					<MenuItem
						key={option.value}
						value={option.value}
					>
						{option.label}
					</MenuItem>
				))}
			</Select>
			{fieldState.error && (
				<FormHelperText error>{fieldState.error.message}</FormHelperText>
			)}
		</>
	);
};

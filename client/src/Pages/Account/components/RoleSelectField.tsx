import MenuItem from "@mui/material/MenuItem";
import { useController } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Select } from "@/Components/inputs";
import type { UserRole } from "@/Types/User";

export const RoleSelectField = () => {
	const { t } = useTranslation();
	const { field } = useController<{ role: UserRole[] }, "role">({ name: "role" });

	const roleOptions: { value: UserRole; label: string }[] = [
		{ value: "admin", label: t("common.auth.roles.admin") },
		{ value: "user", label: t("common.auth.roles.user") },
		{ value: "demo", label: t("common.auth.roles.demo") },
	];

	return (
		<Select
			{...field}
			value={field.value[0] ?? "user"}
			onChange={(e) => field.onChange([e.target.value])}
			fieldLabel={t("common.form.role.option.role.label")}
			fullWidth
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
	);
};

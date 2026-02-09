import { Stack, Typography, IconButton, Divider } from "@mui/material";
import { useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import { ConfigBox, BasePage, Breadcrumb } from "@/Components/v2/design-elements";
import { TextField, Button, Autocomplete } from "@/Components/v2/inputs";
import { UserRoles } from "@/Types/User";
import { useState } from "react";
import { Trash2 } from "lucide-react";

interface RoleOption {
	id: string;
	name: string;
}

const EditUserPage = () => {
	const theme = useTheme();
	const { t } = useTranslation();

	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [email] = useState("");
	const [roles, setRoles] = useState<string[]>([]);

	const editableRoles = UserRoles.filter((role) => role !== "superadmin");

	const roleOptions: RoleOption[] = editableRoles.map((role) => ({
		id: role,
		name: t(`common.auth.roles.${role}`),
	}));

	const selectedRoles = roleOptions.filter((r) => roles.includes(r.id));

	const handleRemoveRole = (roleToRemove: string) => {
		setRoles(roles.filter((role) => role !== roleToRemove));
	};

	return (
		<BasePage>
			<Stack gap={theme.spacing(8)}>
				<ConfigBox
					title={t("pages.account.form.name.title")}
					subtitle={t("pages.account.form.name.description")}
					rightContent={
						<Stack gap={theme.spacing(8)}>
							<TextField
								fieldLabel={t("common.form.name.option.firstName.label")}
								placeholder={t("common.form.name.option.firstName.placeholder")}
								value={firstName}
								onChange={(e) => setFirstName(e.target.value)}
								autoComplete="given-name"
							/>
							<TextField
								fieldLabel={t("common.form.name.option.lastName.label")}
								placeholder={t("common.form.name.option.lastName.placeholder")}
								value={lastName}
								onChange={(e) => setLastName(e.target.value)}
								autoComplete="family-name"
							/>
							<TextField
								fieldLabel={t("common.form.email.option.email.label")}
								placeholder={t("common.form.email.option.email.placeholder")}
								value={email}
								disabled
							/>
						</Stack>
					}
				/>
				<ConfigBox
					title={t("pages.editUser.form.roles.title")}
					subtitle={t("pages.editUser.form.roles.description")}
					rightContent={
						<Stack spacing={theme.spacing(4)}>
							<Autocomplete
								fieldLabel={t("common.form.role.option.role.label")}
								multiple
								options={roleOptions}
								value={selectedRoles}
								getOptionLabel={(option) => option.name}
								onChange={(_: unknown, newValue: RoleOption[]) => {
									setRoles(newValue.map((r) => r.id));
								}}
								isOptionEqualToValue={(option, value) => option.id === value.id}
							/>
							{selectedRoles.length > 0 && (
								<Stack
									flex={1}
									width="100%"
								>
									{selectedRoles.map((role, index) => (
										<Stack
											direction="row"
											alignItems="center"
											key={role.id}
											width="100%"
										>
											<Typography flexGrow={1}>{role.name}</Typography>
											<IconButton
												size="small"
												onClick={() => handleRemoveRole(role.id)}
												aria-label="Remove role"
											>
												<Trash2 size={16} />
											</IconButton>
											{index < selectedRoles.length - 1 && <Divider />}
										</Stack>
									))}
								</Stack>
							)}
						</Stack>
					}
				/>
				<Button
					variant="contained"
					color="primary"
					sx={{ alignSelf: "flex-end", minWidth: 100 }}
				>
					{t("common.buttons.save")}
				</Button>
			</Stack>
		</BasePage>
	);
};

export default EditUserPage;

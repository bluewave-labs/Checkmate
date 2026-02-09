import { Stack, MenuItem } from "@mui/material";
import { useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import { ConfigBox, BasePage, Breadcrumb } from "@/Components/v2/design-elements";
import { TextField, Button, Select } from "@/Components/v2/inputs";
import { UserRoles } from "@/Types/User";
import { useState } from "react";

const EditUserPage = () => {
	const theme = useTheme();
	const { t } = useTranslation();

	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [email] = useState("");
	const [roles, setRoles] = useState<string[]>([]);

	const editableRoles = UserRoles.filter((role) => role !== "superadmin");

	return (
		<BasePage>
			<Breadcrumb breadcrumbOverride={[t("menu.team"), t("editUserPage.title")]} />
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
					title={t("editUserPage.form.role")}
					subtitle={t("pages.account.team.invite.role.placeholder")}
					rightContent={
						<Select
							multiple
							value={roles}
							onChange={(e) => setRoles(e.target.value as string[])}
							placeholder={t("pages.account.team.invite.role.placeholder")}
							sx={{ minWidth: 200 }}
						>
							{editableRoles.map((role) => (
								<MenuItem
									key={role}
									value={role}
								>
									{t(`common.auth.roles.${role}`)}
								</MenuItem>
							))}
						</Select>
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

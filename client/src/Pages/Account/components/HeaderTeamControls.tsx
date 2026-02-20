import Stack from "@mui/material/Stack";
import MenuItem from "@mui/material/MenuItem";
import { Button, Select } from "@/Components/inputs";
import { Icon } from "@/Components/design-elements";
import { UserPlus, Mail } from "lucide-react";

import { UserRoles } from "@/Types/User";
import { useTheme } from "@mui/material/styles";
import type { UserRole } from "@/Types/User";
import { useTranslation } from "react-i18next";
import { useIsAdmin, useIsSuperAdmin } from "@/Hooks/useIsAdmin";

interface HeaderTeamControlsProps {
	filter: UserRole | "";
	onFilterChange: (value: UserRole | "") => void;
	onInviteClick?: () => void;
	onAddMemberClick?: () => void;
}

export const HeaderTeamControls = ({
	filter,
	onFilterChange,
	onInviteClick,
	onAddMemberClick,
}: HeaderTeamControlsProps) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const isAdmin = useIsAdmin();
	const isSuperAdmin = useIsSuperAdmin();

	const handleFilterChange = (event: { target: { value: unknown } }) => {
		onFilterChange(event.target.value as UserRole | "");
	};

	return (
		<Stack
			direction="row"
			alignItems="center"
			justifyContent="flex-end"
			gap={theme.spacing(4)}
		>
			<Select
				value={filter}
				onChange={handleFilterChange}
				placeholder={t("pages.account.team.filter.placeholder")}
				sx={{ minWidth: 150 }}
			>
				<MenuItem value="">{t("pages.account.team.filter.all")}</MenuItem>
				{UserRoles.map((role) => (
					<MenuItem
						key={role}
						value={role}
					>
						{t(`common.auth.roles.${role}`)}
					</MenuItem>
				))}
			</Select>
			{isAdmin && (
				<Button
					variant="contained"
					color="primary"
					startIcon={<Icon icon={Mail} />}
					onClick={onInviteClick}
				>
					{t("common.buttons.inviteMember")}
				</Button>
			)}
			{isSuperAdmin && (
				<Button
					variant="contained"
					color="primary"
					startIcon={<Icon icon={UserPlus} />}
					onClick={onAddMemberClick}
				>
					{t("common.buttons.addMember")}
				</Button>
			)}
		</Stack>
	);
};

import { Stack } from "@mui/material";
import { useTheme } from "@mui/material";
import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { HeaderTeamControls } from "./components/HeaderTeamControls";
import { TeamTable } from "./components/TeamTable";
import { InviteTeamMemberDialog } from "./components/InviteTeamMemberDialog";
import { AddTeamMemberDialog } from "./components/AddTeamMemberDialog";
import { EmptyState } from "@/Components/design-elements";
import { useGet } from "@/Hooks/UseApi";
import type { User, UserRole } from "@/Types/User";

export const TabTeam = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	const [filter, setFilter] = useState<UserRole | "">("");
	const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
	const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);

	const { data: users, refetch } = useGet<User[]>("/auth/users");

	const filteredUsers = useMemo(() => {
		if (!users) return [];
		if (!filter) return users;

		return users.filter((u) => u.role.includes(filter));
	}, [users, filter]);

	const handleOpenInviteDialog = () => setInviteDialogOpen(true);
	const handleCloseInviteDialog = () => setInviteDialogOpen(false);

	const handleOpenAddMemberDialog = () => setAddMemberDialogOpen(true);
	const handleCloseAddMemberDialog = () => setAddMemberDialogOpen(false);

	const handleRefetch = () => {
		refetch();
	};

	const totalUsers = users?.length ?? 0;
	const noUsers = users !== undefined && totalUsers === 0;

	return (
		<Stack gap={theme.spacing(8)}>
			<HeaderTeamControls
				filter={filter}
				onFilterChange={setFilter}
				onInviteClick={handleOpenInviteDialog}
				onAddMemberClick={handleOpenAddMemberDialog}
			/>
			{noUsers ? (
				<EmptyState
					fullscreen
					title={t("pages.account.team.fallback.title")}
					description={t("pages.account.team.fallback.description")}
				/>
			) : (
				<TeamTable users={filteredUsers} />
			)}
			<InviteTeamMemberDialog
				open={inviteDialogOpen}
				onClose={handleCloseInviteDialog}
			/>
			<AddTeamMemberDialog
				open={addMemberDialogOpen}
				onClose={handleCloseAddMemberDialog}
				onSuccess={handleRefetch}
			/>
		</Stack>
	);
};

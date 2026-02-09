import { Stack } from "@mui/material";
import { useTheme } from "@mui/material";
import { useState, useMemo } from "react";
import { HeaderTeamControls } from "./components/HeaderTeamControls";
import { TeamTable } from "./components/TeamTable";
import { InviteTeamMemberDialog } from "./components/InviteTeamMemberDialog";
import { AddTeamMemberDialog } from "./components/AddTeamMemberDialog";
import { useGet } from "@/Hooks/UseApi";
import type { User, UserRole } from "@/Types/User";

export const TabTeam = () => {
	const theme = useTheme();
	const [filter, setFilter] = useState<UserRole | "">("");
	const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
	const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);

	const { data: users } = useGet<User[]>("/auth/users");

	const filteredUsers = useMemo(() => {
		if (!users) return [];
		if (!filter) return users;

		return users.filter((u) => u.role.includes(filter));
	}, [users, filter]);

	const handleOpenInviteDialog = () => setInviteDialogOpen(true);
	const handleCloseInviteDialog = () => setInviteDialogOpen(false);

	const handleOpenAddMemberDialog = () => setAddMemberDialogOpen(true);
	const handleCloseAddMemberDialog = () => setAddMemberDialogOpen(false);

	return (
		<Stack gap={theme.spacing(8)}>
			<HeaderTeamControls
				filter={filter}
				onFilterChange={setFilter}
				onInviteClick={handleOpenInviteDialog}
				onAddMemberClick={handleOpenAddMemberDialog}
			/>
			<TeamTable users={filteredUsers} />
			<InviteTeamMemberDialog
				open={inviteDialogOpen}
				onClose={handleCloseInviteDialog}
			/>
			<AddTeamMemberDialog
				open={addMemberDialogOpen}
				onClose={handleCloseAddMemberDialog}
			/>
		</Stack>
	);
};

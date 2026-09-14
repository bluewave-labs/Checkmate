import { Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material";
import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { HeaderTeamControls } from "./components/HeaderTeamControls";
import { TeamTable } from "./components/TeamTable";
import { PendingInvitesTable } from "./components/PendingInvitesTable";
import { InviteTeamMemberDialog } from "./components/InviteTeamMemberDialog";
import { ChangeInviteDurationDialog } from "./components/ChangeInviteDurationDialog";
import { AddTeamMemberDialog } from "./components/AddTeamMemberDialog";
import { EmptyState } from "@/Components/design-elements";
import { useGet } from "@/Hooks/UseApi";
import { useIsAdmin } from "@/Hooks/useIsAdmin";
import { LAYOUT } from "@/Utils/Theme/constants";
import type { User, UserRole } from "@/Types/User";
import type { Invite } from "@/Types/Invite";

export const TabTeam = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	const isAdmin = useIsAdmin();
	const [filter, setFilter] = useState<UserRole | "">("");
	const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
	const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
	const [invitePendingDuration, setInvitePendingDuration] = useState<Invite | null>(null);

	const { data: users, refetch } = useGet<User[]>("/auth/users");
	const { data: invites, refetch: refetchInvites } = useGet<Invite[]>(
		isAdmin ? "/invite" : null
	);

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

	const handleRefetchInvites = () => {
		refetchInvites();
	};

	const handleCloseChangeDuration = () => setInvitePendingDuration(null);

	const totalUsers = users?.length ?? 0;
	const noUsers = users !== undefined && totalUsers === 0;
	const pendingInvites = invites ?? [];

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
			{isAdmin && (
				<Stack gap={theme.spacing(LAYOUT.XS)}>
					<Typography variant="h1">{t("pages.account.team.invites.title")}</Typography>
					<PendingInvitesTable
						invites={pendingInvites}
						onChangeDuration={setInvitePendingDuration}
					/>
				</Stack>
			)}
			<InviteTeamMemberDialog
				open={inviteDialogOpen}
				onClose={handleCloseInviteDialog}
				onSuccess={handleRefetchInvites}
			/>
			<AddTeamMemberDialog
				open={addMemberDialogOpen}
				onClose={handleCloseAddMemberDialog}
				onSuccess={handleRefetch}
			/>
			<ChangeInviteDurationDialog
				invite={invitePendingDuration}
				onClose={handleCloseChangeDuration}
				onSuccess={handleRefetchInvites}
			/>
		</Stack>
	);
};

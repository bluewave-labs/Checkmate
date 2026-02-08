import { Stack } from "@mui/material";
import { useTheme } from "@mui/material";
import { useState, useMemo } from "react";
import { HeaderTeamControls } from "./components/HeaderTeamControls";
import { TeamTable } from "./components/TeamTable";
import { useGet } from "@/Hooks/UseApi";
import type { User, UserRole } from "@/Types/User";

export const TabTeam = () => {
	const theme = useTheme();
	const [filter, setFilter] = useState<UserRole | "">("");

	const { data: users } = useGet<User[]>("/auth/users");

	const filteredUsers = useMemo(() => {
		if (!users) return [];
		if (!filter) return users;

		return users.filter((u) => u.role.includes(filter));
	}, [users, filter]);

	return (
		<Stack gap={theme.spacing(8)}>
			<HeaderTeamControls
				filter={filter}
				onFilterChange={setFilter}
			/>
			<TeamTable users={filteredUsers} />
		</Stack>
	);
};

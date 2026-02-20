import Typography from "@mui/material/Typography";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Table } from "@/Components/design-elements";
import type { Header } from "@/Components/design-elements/Table";
import { useIsSuperAdmin } from "@/Hooks/useIsAdmin";
import type { User } from "@/Types/User";

interface TeamTableProps {
	users: User[];
}

export const TeamTable = ({ users }: TeamTableProps) => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const isSuperAdmin = useIsSuperAdmin();

	const headers: Header<User>[] = [
		{
			id: "name",
			content: t("common.table.headers.name"),
			render: (row) => <Typography>{`${row.firstName} ${row.lastName}`}</Typography>,
		},
		{
			id: "email",
			content: t("pages.account.team.table.headers.email"),
			render: (row) => <Typography>{row.email}</Typography>,
		},
		{
			id: "role",
			content: t("pages.account.team.table.headers.role"),
			render: (row) => (
				<Typography>
					{row.role.map((r) => t(`common.auth.roles.${r}`)).join(", ")}
				</Typography>
			),
		},
		{
			id: "created",
			content: t("pages.account.team.table.headers.created"),
			render: (row) => (
				<Typography>{new Date(row.createdAt).toLocaleDateString()}</Typography>
			),
		},
	];

	const handleRowClick = (row: User) => {
		if (isSuperAdmin) {
			navigate(`/account/team/${row.id}`);
		}
	};

	return (
		<Table
			headers={headers}
			data={users}
			onRowClick={isSuperAdmin ? handleRowClick : undefined}
		/>
	);
};

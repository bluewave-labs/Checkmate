import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Table } from "@/Components/design-elements";
import { Pagination } from "@/Components/design-elements/Table";
import type { Header } from "@/Components/design-elements/Table";
import { useIsAdmin } from "@/Hooks/useIsAdmin";
import type { User } from "@/Types/User";

interface TeamTableProps {
	users: User[];
}

export const TeamTable = ({ users }: TeamTableProps) => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const isAdmin = useIsAdmin();
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);

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
		if (isAdmin) {
			navigate(`/account/team/${row.id}`);
		}
	};

	const handlePageChange = (
		_e: React.MouseEvent<HTMLButtonElement> | null,
		newPage: number
	) => {
		setPage(newPage);
	};

	const handleRowsPerPageChange = (
		e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
	) => {
		setPage(0);
		setRowsPerPage(Number(e.target.value));
	};

	const pagedUsers = users.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

	return (
		<Box>
			<Table
				headers={headers}
				data={pagedUsers}
				onRowClick={isAdmin ? handleRowClick : undefined}
			/>
			{users.length > 0 && (
				<Pagination
					component="div"
					count={users.length}
					page={page}
					rowsPerPage={rowsPerPage}
					onPageChange={handlePageChange}
					onRowsPerPageChange={handleRowsPerPageChange}
					itemsOnPage={pagedUsers.length}
				/>
			)}
		</Box>
	);
};

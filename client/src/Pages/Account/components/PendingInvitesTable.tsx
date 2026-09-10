import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import { Table, ValueLabel } from "@/Components/design-elements";
import { Pagination } from "@/Components/design-elements/Table";
import type { Header } from "@/Components/design-elements/Table";
import { ActionsMenu } from "@/Components/actions-menu";
import type { ActionMenuItem } from "@/Components/actions-menu";
import { useClientPagination } from "@/Hooks/useClientPagination";
import { formatDateWithTz } from "@/Utils/TimeUtils";
import type { Invite } from "@/Types/Invite";

interface PendingInvitesTableProps {
	invites: Invite[];
	onChangeDuration: (invite: Invite) => void;
}

const isExpiredInvite = (invite: Invite) => new Date(invite.expiry).getTime() <= Date.now();

export const PendingInvitesTable = ({ invites, onChangeDuration }: PendingInvitesTableProps) => {
	const { t } = useTranslation();
	const { pagedRows, paginationProps } = useClientPagination(invites);

	const headers: Header<Invite>[] = [
		{
			id: "email",
			content: t("pages.account.team.table.headers.email"),
			render: (row) => <Typography>{row.email}</Typography>,
		},
		{
			id: "role",
			content: t("pages.account.team.table.headers.role"),
			render: (row) => (
				<Typography>{row.role.map((r) => t(`common.auth.roles.${r}`)).join(", ")}</Typography>
			),
		},
		{
			id: "status",
			content: t("pages.account.team.invites.table.headers.status"),
			render: (row) =>
				isExpiredInvite(row) ? (
					<ValueLabel
						value="negative"
						text={t("pages.account.team.invites.status.expired")}
					/>
				) : (
					<ValueLabel
						value="positive"
						text={t("pages.account.team.invites.status.pending")}
					/>
				),
		},
		{
			id: "expiry",
			content: t("pages.account.team.invites.table.headers.expires"),
			render: (row) => (
				<Typography>{formatDateWithTz(row.expiry, "MMM D, YYYY h:mm A")}</Typography>
			),
		},
		{
			id: "actions",
			content: t("common.table.headers.actions"),
			render: (row) => {
				const items: ActionMenuItem[] = [
					{
						id: "change-duration",
						label: t("pages.account.team.invites.actions.changeDuration"),
						action: () => onChangeDuration(row),
						closeMenu: true,
					},
				];
				return <ActionsMenu items={items} />;
			},
		},
	];

	return (
		<>
			<Table
				headers={headers}
				data={pagedRows}
				emptyViewText={t("pages.account.team.invites.fallback")}
			/>
			{invites.length > 0 && <Pagination {...paginationProps} />}
		</>
	);
};

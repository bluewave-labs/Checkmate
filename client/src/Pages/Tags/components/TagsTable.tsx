import { ActionsMenu, type ActionMenuItem } from "@/Components/actions-menu";
import Typography from "@mui/material/Typography";
import type { Header } from "@/Components/design-elements/Table";
import { Table, ColoredLabel } from "@/Components/design-elements";
import { Pagination } from "@/Components/design-elements/Table";
import { useClientPagination } from "@/Hooks/useClientPagination";

import type { Tag } from "@/Types/Tag";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material";

interface TagsTableProps {
	tags: Tag[];
	setSelectedTag: Function;
}

export const TagsTable = ({ tags, setSelectedTag }: TagsTableProps) => {
	const navigate = useNavigate();
	const { t } = useTranslation();
	const theme = useTheme();
	const { pagedRows, paginationProps } = useClientPagination(tags);

	const getActions = (tag: Tag): ActionMenuItem[] => {
		return [
			{
				id: 1,
				label: t("pages.common.monitors.actions.configure"),
				action: () => {
					navigate(`/tags/configure/${tag.id}`);
				},
				closeMenu: true,
			},

			{
				id: 2,
				label: (
					<Typography color={theme.palette.error.main}>
						{t("pages.common.monitors.actions.delete")}
					</Typography>
				),
				action: async () => {
					setSelectedTag(tag);
				},
				closeMenu: true,
			},
		];
	};

	const getHeaders = () => {
		const headers: Header<Tag>[] = [
			{
				id: "name",
				content: t("common.table.headers.name"),
				render: (row) => {
					return <Typography>{row?.name}</Typography>;
				},
			},

			{
				id: "color",
				content: t("pages.tags.table.headers.color"),
				render: (row) => {
					return <Typography textTransform={"capitalize"}>{row?.color}</Typography>;
				},
			},
			{
				id: "chip",
				content: t("pages.tags.table.headers.appearance"),
				render: (row) => {
					return (
						<ColoredLabel
							text={row.name}
							color={row.color}
						/>
					);
				},
			},

			{
				id: "actions",
				content: t("common.table.headers.actions"),
				render: (row) => {
					return <ActionsMenu items={getActions(row)} />;
				},
			},
		];
		return headers;
	};

	return (
		<>
			<Table
				headers={getHeaders()}
				data={pagedRows}
				onRowClick={(row) => {
					navigate(`/tags/configure/${row.id}`);
				}}
			/>
			{tags.length > 0 && <Pagination {...paginationProps} />}
		</>
	);
};

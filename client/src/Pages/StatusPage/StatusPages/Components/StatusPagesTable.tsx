import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Table, type Header, ValueLabel } from "@/Components/design-elements";
import { Pagination } from "@/Components/design-elements/Table";
import { ActionsMenu, type ActionMenuItem } from "@/Components/actions-menu";
import { useClientPagination } from "@/Hooks/useClientPagination";
import { ExternalLink, Globe, Lock } from "lucide-react";
import { LAYOUT } from "@/Utils/Theme/constants";

import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";

import { PUBLIC_STATUS_PAGE_PREFIX, type StatusPage } from "@/Types/StatusPage";

const ACCESS_ICON_SIZE = 16;

interface StatusPagesTableProps {
	data: StatusPage[];
	setSelectedStatusPage: (statusPage: StatusPage | null) => void;
}

export const StatusPagesTable = ({
	data,
	setSelectedStatusPage,
}: StatusPagesTableProps) => {
	const { t } = useTranslation();
	const theme = useTheme();
	const navigate = useNavigate();
	const { pagedRows, paginationProps } = useClientPagination(data);

	const getActions = (row: StatusPage): ActionMenuItem[] => {
		return [
			{
				id: 1,
				label: t("common.buttons.configure"),
				action: () => {
					navigate(`/status/configure/${row.url}`);
				},
				closeMenu: true,
			},
			{
				id: 2,
				label: (
					<Typography color={theme.palette.error.main}>
						{t("common.buttons.delete")}
					</Typography>
				),
				action: () => setSelectedStatusPage(row),
				closeMenu: true,
			},
		];
	};

	const handleUrlClick = (e: React.MouseEvent, row: StatusPage) => {
		if (row.isPublished) {
			e.stopPropagation();
			const url = `${PUBLIC_STATUS_PAGE_PREFIX}/${row.url}`;
			window.open(url, "_blank", "noopener,noreferrer");
		}
	};

	const getHeaders = (): Header<StatusPage>[] => {
		return [
			{
				id: "name",
				content: t("pages.statusPages.table.headers.name"),
				render: (row) => row.companyName,
			},
			{
				id: "url",
				content: t("pages.statusPages.table.headers.url"),
				render: (row) => {
					const content = row.isPublished
						? `/${row.url}`
						: t("pages.statusPages.table.unpublished");
					return (
						<Stack
							direction="row"
							alignItems="center"
							justifyContent="center"
							gap={theme.spacing(2)}
							paddingLeft={theme.spacing(2)}
							paddingRight={theme.spacing(2)}
							onClick={(e) => handleUrlClick(e, row)}
							sx={{
								...(row.isPublished && {
									display: "inline-flex",
									":hover": {
										cursor: "pointer",
										borderBottom: 1,
									},
								}),
							}}
						>
							<Typography>{content}</Typography>
							{row.isPublished && <ExternalLink size={18} />}
						</Stack>
					);
				},
			},
			{
				id: "type",
				content: t("common.table.headers.type"),
				render: (row) => row.type.join(", "),
			},
			{
				id: "access",
				content: t("pages.statusPages.table.headers.access"),
				align: "center",
				render: (row) => {
					const Icon = row.passwordProtected ? Lock : Globe;
					const label = row.passwordProtected
						? t("pages.statusPages.table.access.protected")
						: t("pages.statusPages.table.access.public");
					return (
						<Stack
							direction="row"
							alignItems="center"
							justifyContent="center"
							gap={theme.spacing(LAYOUT.XS)}
							color={theme.palette.text.secondary}
						>
							<Icon
								size={ACCESS_ICON_SIZE}
								aria-hidden
							/>
							<Typography color={theme.palette.text.secondary}>{label}</Typography>
						</Stack>
					);
				},
			},
			{
				id: "status",
				content: t("common.table.headers.status"),
				render: (row) => (
					<ValueLabel
						value={row.isPublished ? "positive" : "neutral"}
						text={
							row.isPublished
								? t("pages.statusPages.table.published")
								: t("pages.statusPages.table.unpublished")
						}
					/>
				),
			},
			{
				id: "actions",
				content: t("common.table.headers.actions"),
				render: (row) => {
					return <ActionsMenu items={getActions(row)} />;
				},
			},
		];
	};

	const handleRowClick = (statusPage: StatusPage) => {
		navigate(`/status/${statusPage.url}`);
	};

	return (
		<Box>
			<Table
				headers={getHeaders()}
				data={pagedRows}
				onRowClick={handleRowClick}
				emptyViewText={t("common.table.empty")}
			/>
			{data.length > 0 && <Pagination {...paginationProps} />}
		</Box>
	);
};

export default StatusPagesTable;

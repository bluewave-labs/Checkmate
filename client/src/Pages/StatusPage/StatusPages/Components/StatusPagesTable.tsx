import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Table, type Header, ValueLabel } from "@/Components/design-elements";
import { ActionsMenu, type ActionMenuItem } from "@/Components/actions-menu";
import { ExternalLink } from "lucide-react";

import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";

import type { StatusPage } from "@/Types/StatusPage";

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
			const url = `/status/public/${row.url}`;
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
				id: "status",
				content: t("common.table.headers.status"),
				render: (row) => {
					return (
						<ValueLabel
							value={row.isPublished ? "positive" : "neutral"}
							text={
								row.isPublished
									? t("pages.statusPages.table.published")
									: t("pages.statusPages.table.unpublished")
							}
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
	};

	const handleRowClick = (statusPage: StatusPage) => {
		navigate(`/status/${statusPage.url}`);
	};

	return (
		<Box>
			<Table
				headers={getHeaders()}
				data={data}
				onRowClick={handleRowClick}
				emptyViewText={t("common.table.empty")}
			/>
		</Box>
	);
};

export default StatusPagesTable;

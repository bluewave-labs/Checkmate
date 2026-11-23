import { ActionsMenu, type ActionMenuItem } from "@/Components/actions-menu";
import Typography from "@mui/material/Typography";
import type { Header } from "@/Components/design-elements/Table";
import { Table } from "@/Components/design-elements";
import { Pagination } from "@/Components/design-elements/Table";
import { useClientPagination } from "@/Hooks/useClientPagination";

import type { ProxyResponse } from "@/Types/Proxy";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material";

interface ProxiesTableProps {
	proxies: ProxyResponse[];
	setSelectedProxy: Function;
}

export const ProxiesTable = ({ proxies, setSelectedProxy }: ProxiesTableProps) => {
	const navigate = useNavigate();
	const { t } = useTranslation();
	const theme = useTheme();
	const { pagedRows, paginationProps } = useClientPagination(proxies);

	const getActions = (proxy: ProxyResponse): ActionMenuItem[] => {
		return [
			{
				id: 1,
				label: t("pages.common.monitors.actions.configure"),
				action: () => {
					navigate(`/proxies/configure/${proxy.id}`);
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
					setSelectedProxy(proxy);
				},
				closeMenu: true,
			},
		];
	};

	const getHeaders = () => {
		const headers: Header<ProxyResponse>[] = [
			{
				id: "name",
				content: t("common.table.headers.name"),
				render: (row) => {
					return <Typography>{row?.name}</Typography>;
				},
			},
			{
				id: "protocol",
				content: t("pages.proxies.table.headers.protocol"),
				render: (row) => {
					return <Typography>{row?.protocol}</Typography>;
				},
			},
			{
				id: "host",
				content: t("pages.proxies.table.headers.host"),
				render: (row) => {
					return <Typography>{row?.host}</Typography>;
				},
			},
			{
				id: "port",
				content: t("pages.proxies.table.headers.port"),
				render: (row) => {
					return <Typography>{row?.port}</Typography>;
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
					navigate(`/proxies/configure/${row.id}`);
				}}
			/>
			{proxies.length > 0 && <Pagination {...paginationProps} />}
		</>
	);
};

// Components
import { Stack, Typography } from "@mui/material";
import Breadcrumbs from "../../../Components/Breadcrumbs";
import MonitorCountHeader from "../../../Components/MonitorCountHeader";
import MonitorCreateHeader from "../../../Components/MonitorCreateHeader";
import MonitorsTable from "./Components/MonitorsTable";
import Pagination from "../../..//Components/Table/TablePagination";
import GenericFallback from "../../../Components/GenericFallback";
import Fallback from "../../../Components/Fallback";
// Utils
import { useTheme } from "@emotion/react";
import { useMonitorFetch } from "./Hooks/useMonitorFetch";
import { useState } from "react";
import { useIsAdmin } from "../../../Hooks/useIsAdmin";
import { useTranslation } from "react-i18next";
// Constants
const BREADCRUMBS = [{ name: `infrastructure`, path: "/infrastructure" }];

const InfrastructureMonitors = () => {
	// Redux state
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(5);
	const [updateTrigger, setUpdateTrigger] = useState(false);

	// Utils
	const theme = useTheme();
	const isAdmin = useIsAdmin();
	const { t } = useTranslation();

	// Handlers
	const handleActionMenuDelete = () => {
		setUpdateTrigger(!updateTrigger);
	};

	const handleChangePage = (event, newPage) => {
		setPage(newPage);
	};

	const handleChangeRowsPerPage = (event) => {
		setRowsPerPage(event.target.value);
	};

	const { monitors, summary, isLoading, networkError } = useMonitorFetch({
		page,
		rowsPerPage,
		updateTrigger,
	});

	if (networkError === true) {
		return (
			<GenericFallback>
				<Typography
					variant="h1"
					marginY={theme.spacing(4)}
					color={theme.palette.primary.contrastTextTertiary}
				>
					{t("networkError")}
				</Typography>
				<Typography>{t("checkConnection")}</Typography>
			</GenericFallback>
		);
	}

	if (!isLoading && monitors?.length === 0) {
		return (
			<Fallback
				vowelStart={true}
				title="infrastructure monitor"
				checks={[
					"Track the performance of your servers",
					"Identify bottlenecks and optimize usage",
					"Ensure reliability with real-time monitoring",
				]}
				link="/infrastructure/create"
				isAdmin={isAdmin}
			/>
		);
	}

	return (
		<Stack gap={theme.spacing(10)}>
			<Breadcrumbs list={BREADCRUMBS} />
			<MonitorCreateHeader
				isAdmin={isAdmin}
				shouldRender={!isLoading}
				path="/infrastructure/create"
			/>
			<MonitorCountHeader
				shouldRender={!isLoading}
				heading="Infrastructure monitors"
				monitorCount={summary?.totalMonitors ?? 0}
			/>
			<MonitorsTable
				shouldRender={!isLoading}
				monitors={monitors}
				isAdmin={isAdmin}
				handleActionMenuDelete={handleActionMenuDelete}
			/>
			<Pagination
				itemCount={summary?.totalMonitors}
				paginationLabel={t("monitors")}
				page={page}
				rowsPerPage={rowsPerPage}
				handleChangePage={handleChangePage}
				handleChangeRowsPerPage={handleChangeRowsPerPage}
			/>
		</Stack>
	);
};

export default InfrastructureMonitors;

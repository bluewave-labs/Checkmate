// Components
import { Stack, Typography } from "@mui/material";
import Breadcrumbs from "../../../Components/Breadcrumbs";
import CreateMonitorHeader from "../../../Components/MonitorCreateHeader";
import MonitorTable from "./Components/MonitorTable";
import Pagination from "../../../Components/Table/TablePagination";
import Fallback from "../../../Components/Fallback";
import GenericFallback from "../../../Components/GenericFallback";

// Utils
import { useState } from "react";
import { useTheme } from "@mui/material/styles";
import { useIsAdmin } from "../../../Hooks/useIsAdmin";
import { useSubscribeToDepinMonitors } from "../../../Hooks/useSubscribeToDepinMonitors";
import SkeletonLayout from "./Components/Skeleton";
import { useTranslation } from "react-i18next";
// Constants
const BREADCRUMBS = [{ name: `Distributed Uptime`, path: "/distributed-uptime" }];

const DistributedUptimeMonitors = () => {
	// Local state
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);

	// Utils
	const theme = useTheme();
	const isAdmin = useIsAdmin();
	const { t } = useTranslation();
	const [monitors, count, isLoading, networkError] = useSubscribeToDepinMonitors(
		page,
		rowsPerPage
	);
	// Handlers
	const handleChangePage = (event, newPage) => {
		setPage(newPage);
	};

	const handleChangeRowsPerPage = (event) => {
		setRowsPerPage(event.target.value);
		setPage(0);
	};

	if (isLoading) {
		return <SkeletonLayout />;
	}

	if (networkError) {
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

	if (count === 0) {
		return (
			<Fallback
				vowelStart={false}
				title="distributed uptime monitor"
				checks={[
					"Check if a server is online from multiple locations",
					"Detect outages and performance issues in real time",
					"Reduce false alarms by verifying downtime from different networks",
					"Provide insights on regional availability and latency",
				]}
				link="/distributed-uptime/create"
				isAdmin={isAdmin}
			/>
		);
	}
	return (
		<Stack gap={theme.spacing(10)}>
			<Breadcrumbs list={BREADCRUMBS} />
			<CreateMonitorHeader
				isAdmin={isAdmin}
				shouldRender={!isLoading}
				path="/distributed-uptime/create"
			/>
			<MonitorTable
				isLoading={isLoading}
				monitors={monitors}
			/>
			<Pagination
				itemCount={count}
				paginationLabel="monitors"
				page={page}
				rowsPerPage={rowsPerPage}
				handleChangePage={handleChangePage}
				handleChangeRowsPerPage={handleChangeRowsPerPage}
			/>
		</Stack>
	);
};

export default DistributedUptimeMonitors;

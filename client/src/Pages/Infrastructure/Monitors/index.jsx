// Components
import { Stack, Typography } from "@mui/material";
import Breadcrumbs from "../../../Components/Breadcrumbs";
import MonitorCountHeader from "../../../Components/MonitorCountHeader";
import MonitorCreateHeader from "../../../Components/MonitorCreateHeader";
import MonitorsTable from "./Components/MonitorsTable";
import Pagination from "../../..//Components/Table/TablePagination";
import GenericFallback from "../../../Components/GenericFallback";
import Fallback from "../../../Components/Fallback";
import Filter from "./Components/Filters";
// Utils
import { useTheme } from "@emotion/react";
import { useMonitorFetch } from "./Hooks/useMonitorFetch";
import { useState } from "react";
import { useIsAdmin } from "../../../Hooks/useIsAdmin";
import { useTranslation } from "react-i18next";
import SearchComponent from "../../Uptime/Monitors/Components/SearchComponent";
import { useMemo } from "react";
// Constants
const BREADCRUMBS = [{ name: `infrastructure`, path: "/infrastructure" }];

const InfrastructureMonitors = () => {
	// Redux state
	const [search, setSearch] = useState(undefined);
	const [isSearching, setIsSearching] = useState(false);
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(5);
	const [updateTrigger, setUpdateTrigger] = useState(false);
	const [selectedTypes, setSelectedTypes] = useState(undefined);
	const [selectedState, setSelectedState] = useState(undefined);
	const [selectedStatus, setSelectedStatus] = useState(undefined);
	const [toFilterStatus, setToFilterStatus] = useState(undefined);
	const [toFilterActive, setToFilterActive] = useState(undefined);

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

	const handleReset = () => {
		setSelectedState(undefined);
		setSelectedTypes(undefined);
		setSelectedStatus(undefined);
		setToFilterStatus(undefined);
		setToFilterActive(undefined);
	};

	const field = toFilterStatus !== undefined ? "status" : undefined;

	const { monitors, summary, isLoading, networkError } = useMonitorFetch({
		page: page,
		field: field,
		filter: toFilterStatus,
		rowsPerPage: rowsPerPage,
		updateTrigger,
	});

	const filteredMonitors = useMemo(() => {
      if (!search) return monitors;
      return monitors.filter(monitor =>
        monitor.name?.toLowerCase().includes(search.toLowerCase())
      );
    }, [monitors, search]);

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

	if (!isLoading && typeof summary?.totalMonitors === "undefined") {
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
				isLoading={isLoading}
				path="/infrastructure/create"
			/>
			<Stack direction={"row"}>
				<MonitorCountHeader
					shouldRender={!isLoading}
					monitorCount={summary?.totalMonitors ?? 0}
				/>
				<Filter
					selectedTypes={selectedTypes}
					setSelectedTypes={setSelectedTypes}
					selectedStatus={selectedStatus}
					setSelectedStatus={setSelectedStatus}
					selectedState={selectedState}
					setSelectedState={setSelectedState}
					setToFilterStatus={setToFilterStatus}
					setToFilterActive={setToFilterActive}
					handleReset={handleReset}
				/>
				<SearchComponent
					monitors={monitors}
					onSearchChange={setSearch}
					setIsSearching={setIsSearching}
				/>
			</Stack>
			
			<MonitorsTable
			shouldRender={!isLoading}
			isSearching={isSearching}
			monitors={search ? filteredMonitors : monitors	}
			isAdmin={isAdmin}
			handleActionMenuDelete={handleActionMenuDelete}
			/>

			<Pagination
				itemCount={search ? filteredMonitors.length : summary?.totalMonitors}
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

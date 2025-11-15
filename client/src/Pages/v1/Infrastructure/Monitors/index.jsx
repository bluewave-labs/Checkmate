// Components
import { Stack, Tab } from "@mui/material";
import { TabContext, TabPanel } from "@mui/lab";
import Breadcrumbs from "@/Components/v1/Breadcrumbs/index.jsx";
import MonitorCountHeader from "@/Components/v1/MonitorCountHeader/index.jsx";
import MonitorCreateHeader from "@/Components/v1/MonitorCreateHeader/index.jsx";
import MonitorsTable from "./Components/MonitorsTable/index.jsx";
import Pagination from "@/Components/v1/Table/TablePagination/index.jsx";
import PageStateWrapper from "@/Components/v1/PageStateWrapper/index.jsx";
import Filter from "./Components/Filters/index.jsx";
import SearchComponent from "../../Uptime/Monitors/Components/SearchComponent/index.jsx";
import CustomTabList from "@/Components/v1/Tab/index.jsx";
// Utils
import { useTheme } from "@emotion/react";
import { useEffect, useState } from "react";
import { useIsAdmin } from "../../../../Hooks/v1/useIsAdmin.js";
import { useTranslation } from "react-i18next";
import { useFetchMonitorsByTeamId } from "../../../../Hooks/v1/monitorHooks.js";
import { useDispatch, useSelector } from "react-redux";
import { setRowsPerPage } from "../../../../Features/UI/uiSlice.js";
// Constants
const BREADCRUMBS = [{ name: `infrastructure`, path: "/infrastructure" }];

const InfrastructureMonitors = () => {
	// Redux state
	const rowsPerPage = useSelector((state) => state.ui?.infrastructure?.rowsPerPage ?? 5);
	const dispatch = useDispatch();

	// Local state
	const [tab, setTab] = useState("hardware");
	const [page, setPage] = useState(0);
	const [updateTrigger, setUpdateTrigger] = useState(false);
	const [selectedStatus, setSelectedStatus] = useState(undefined);
	const [toFilterStatus, setToFilterStatus] = useState(undefined);
	const [search, setSearch] = useState(undefined);
	const [isSearching, setIsSearching] = useState(false);

	// Utils
	const theme = useTheme();
	const isAdmin = useIsAdmin();
	const { t } = useTranslation();

	// Handlers
	const handleTabChange = (event, newTab) => {
		setTab(newTab);
		setPage(0); // Reset to first page when changing tabs
		setSearch(undefined); // Clear search
		setSelectedStatus(undefined); // Clear filters
		setToFilterStatus(undefined);
	};

	const handleActionMenuDelete = () => {
		setUpdateTrigger(!updateTrigger);
	};

	const handleChangePage = (event, newPage) => {
		setPage(newPage);
	};

	const handleChangeRowsPerPage = (event) => {
		dispatch(
			setRowsPerPage({
				value: parseInt(event.target.value, 10),
				table: "infrastructure",
			})
		);
		setPage(0);
	};

	useEffect(() => {
		if (isSearching) {
			setPage(0);
		}
	}, [isSearching]);

	const handleReset = () => {
		setSelectedStatus(undefined);
		setToFilterStatus(undefined);
	};

	const field = toFilterStatus !== undefined ? "status" : undefined;

	// Determine monitor types based on active tab
	const types = tab === "hardware" ? ["hardware"] : ["docker"];

	const [monitors, summary, isLoading, networkError] = useFetchMonitorsByTeamId({
		limit: 1,
		types: types,
		page,
		field: field,
		filter: toFilterStatus ?? search,
		rowsPerPage,
		updateTrigger,
	});

	return (
		<>
			<Stack gap={theme.spacing(10)}>
				<Breadcrumbs list={BREADCRUMBS} />
				<MonitorCreateHeader
					isAdmin={isAdmin}
					isLoading={isLoading}
					path={tab === "docker" ? "/infrastructure/create?type=docker" : "/infrastructure/create?type=hardware"}
				/>

				<TabContext value={tab}>
					<CustomTabList value={tab} onChange={handleTabChange}>
						<Tab label="Hardware" value="hardware" />
						<Tab label="Docker Monitoring" value="docker" />
					</CustomTabList>

					<TabPanel value="hardware" sx={{ padding: 0 }}>
						<PageStateWrapper
							networkError={networkError}
							isLoading={isLoading}
							items={monitors}
							type="infrastructureMonitor"
							fallbackLink="/infrastructure/create?type=hardware"
						>
							<Stack gap={theme.spacing(10)}>
								<Stack direction={"row"}>
									<MonitorCountHeader
										isLoading={isLoading}
										monitorCount={summary?.totalMonitors ?? 0}
									/>
									<Filter
										selectedStatus={selectedStatus}
										setSelectedStatus={setSelectedStatus}
										setToFilterStatus={setToFilterStatus}
										handleReset={handleReset}
									/>
									<SearchComponent
										monitors={monitors}
										onSearchChange={setSearch}
										setIsSearching={setIsSearching}
									/>
								</Stack>

								<MonitorsTable
									isLoading={isLoading}
									monitors={monitors}
									isAdmin={isAdmin}
									handleActionMenuDelete={handleActionMenuDelete}
									isSearching={isSearching}
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
						</PageStateWrapper>
					</TabPanel>

					<TabPanel value="docker" sx={{ padding: 0 }}>
						<PageStateWrapper
							networkError={networkError}
							isLoading={isLoading}
							items={monitors}
							type="infrastructureMonitor"
							fallbackLink="/infrastructure/create?type=docker"
						>
							<Stack gap={theme.spacing(10)}>
								<Stack direction={"row"}>
									<MonitorCountHeader
										isLoading={isLoading}
										monitorCount={summary?.totalMonitors ?? 0}
									/>
									<Filter
										selectedStatus={selectedStatus}
										setSelectedStatus={setSelectedStatus}
										setToFilterStatus={setToFilterStatus}
										handleReset={handleReset}
									/>
									<SearchComponent
										monitors={monitors}
										onSearchChange={setSearch}
										setIsSearching={setIsSearching}
									/>
								</Stack>

								<MonitorsTable
									isLoading={isLoading}
									monitors={monitors}
									isAdmin={isAdmin}
									handleActionMenuDelete={handleActionMenuDelete}
									isSearching={isSearching}
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
						</PageStateWrapper>
					</TabPanel>
				</TabContext>
			</Stack>
		</>
	);
};

export default InfrastructureMonitors;

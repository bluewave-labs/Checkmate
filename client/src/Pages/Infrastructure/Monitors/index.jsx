// Components
import { Stack } from "@mui/material";
import Breadcrumbs from "../../../Components/Breadcrumbs";
import MonitorCountHeader from "../../../Components/MonitorCountHeader";
import MonitorCreateHeader from "../../../Components/MonitorCreateHeader";
import MonitorsTable from "./Components/MonitorsTable";
import Pagination from "../../..//Components/Table/TablePagination";
import PageStateWrapper from "../../../Components/PageStateWrapper";
import Filter from "./Components/Filters";
import SearchComponent from "../../Uptime/Monitors/Components/SearchComponent";
// Utils
import { useTheme } from "@emotion/react";
import { useEffect, useState } from "react";
import { useIsAdmin } from "../../../Hooks/useIsAdmin";
import { useTranslation } from "react-i18next";
import { useFetchMonitorsByTeamId } from "../../../Hooks/monitorHooks";
import { useDispatch, useSelector } from "react-redux";
import { setRowsPerPage } from "../../../Features/UI/uiSlice";
// Constants
const TYPES = ["hardware"];
const BREADCRUMBS = [{ name: `infrastructure`, path: "/infrastructure" }];

const InfrastructureMonitors = () => {
	// Redux state
	const rowsPerPage = useSelector((state) => state.ui?.infrastructure?.rowsPerPage ?? 5);
	const dispatch = useDispatch();

	// Local state
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

	const [monitors, summary, isLoading, networkError] = useFetchMonitorsByTeamId({
		limit: 1,
		types: TYPES,
		page,
		field: field,
		filter: toFilterStatus ?? search,
		rowsPerPage,
		updateTrigger,
	});

	return (
		<>
			<PageStateWrapper
				networkError={networkError}
				isLoading={isLoading}
				items={monitors}
				type="infrastructureMonitor"
				fallbackLink="/infrastructure/create"
			>
				<Stack gap={theme.spacing(10)}>
					<Breadcrumbs list={BREADCRUMBS} />
					<MonitorCreateHeader
						isAdmin={isAdmin}
						isLoading={isLoading}
						path="/infrastructure/create"
					/>
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
		</>
	);
};

export default InfrastructureMonitors;

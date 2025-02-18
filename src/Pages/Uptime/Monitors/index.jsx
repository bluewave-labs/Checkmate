// Components
import Breadcrumbs from "../../../Components/Breadcrumbs";
import Greeting from "../../../Utils/greeting";
import StatusBoxes from "./Components/StatusBoxes";
import UptimeDataTable from "./Components/UptimeDataTable";
import Pagination from "../../../Components/Table/TablePagination";
import CreateMonitorHeader from "../../../Components/MonitorCreateHeader";
import Fallback from "../../../Components/Fallback";
import GenericFallback from "../../../Components/GenericFallback";
import SearchComponent from "./Components/SearchComponent";

import MonitorCountHeader from "../../../Components/MonitorCountHeader";

// MUI Components
import { Stack, Box, Button, Typography } from "@mui/material";

// Utils
import { useState, useCallback } from "react";
import { useIsAdmin } from "../../../Hooks/useIsAdmin";
import { useTheme } from "@emotion/react";
import { useNavigate } from "react-router-dom";
import useMonitorsFetch from "./Hooks/useMonitorsFetch";
import { useSelector, useDispatch } from "react-redux";
import { setRowsPerPage } from "../../../Features/UI/uiSlice";
import PropTypes from "prop-types";

const BREADCRUMBS = [{ name: `Uptime`, path: "/uptime" }];

const CreateMonitorButton = ({ shouldRender }) => {
	// Utils
	const navigate = useNavigate();
	if (shouldRender === false) {
		return;
	}

	return (
		<Box alignSelf="flex-end">
			<Button
				variant="contained"
				color="accent"
				onClick={() => {
					navigate("/uptime/create");
				}}
			>
				Create new
			</Button>
		</Box>
	);
};

CreateMonitorButton.propTypes = {
	shouldRender: PropTypes.bool,
};

const UptimeMonitors = () => {
	// Redux state
	const { authToken, user } = useSelector((state) => state.auth);
	const rowsPerPage = useSelector((state) => state.ui.monitors.rowsPerPage);

	// Local state
	const [search, setSearch] = useState(undefined);
	const [page, setPage] = useState(undefined);
	const [sort, setSort] = useState(undefined);
	const [isSearching, setIsSearching] = useState(false);
	const [monitorUpdateTrigger, setMonitorUpdateTrigger] = useState(false);

	// Utils
	const theme = useTheme();
	const isAdmin = useIsAdmin();
	const dispatch = useDispatch();

	// Handlers
	const handleChangePage = (event, newPage) => {
		setPage(newPage);
	};

	const handleChangeRowsPerPage = (event) => {
		dispatch(
			setRowsPerPage({
				value: parseInt(event.target.value, 10),
				table: "monitors",
			})
		);
		setPage(0);
	};

	const triggerUpdate = useCallback(() => {
		setMonitorUpdateTrigger((prev) => !prev);
	}, []);

	const teamId = user.teamId;
	const {
		monitorsAreLoading,
		monitors,
		filteredMonitors,
		monitorsSummary,
		networkError,
	} = useMonitorsFetch({
		authToken,
		teamId,
		limit: 25,
		page: page,
		rowsPerPage: rowsPerPage,
		filter: search,
		field: sort?.field,
		order: sort?.order,
		triggerUpdate: monitorUpdateTrigger,
	});
	const totalMonitors = monitorsSummary?.totalMonitors;
	if (networkError) {
		return (
			<GenericFallback>
				<Typography
					variant="h1"
					marginY={theme.spacing(4)}
					color={theme.palette.primary.contrastTextTertiary}
				>
					Network error
				</Typography>
				<Typography>Please check your connection</Typography>
			</GenericFallback>
		);
	}
	if (
		!monitorsAreLoading &&
		(totalMonitors === 0 || typeof totalMonitors === "undefined")
	) {

		return (
			<Fallback
				vowelStart={true}
				title="uptime monitor"
				checks={[
					"Check if websites or servers are online & responsive",
					"Alert teams about downtime or performance issues",
					"Monitor HTTP endpoints, pings, containers & ports",
					"Track historical uptime and reliability trends",
				]}
				link="/uptime/create"
				isAdmin={isAdmin}
			/>
		);
	}
	return (
		<Stack
			className="monitors"
			gap={theme.spacing(10)}
		>
			<Breadcrumbs list={BREADCRUMBS} />
			<CreateMonitorHeader
				isAdmin={isAdmin}
				shouldRender={!monitorsAreLoading}
				path="/uptime/create"
			/>
			<Greeting type="uptime" />
			<StatusBoxes
				monitorsSummary={monitorsSummary}
				shouldRender={!monitorsAreLoading}
			/>

			<Stack direction={"row"}>
				<MonitorCountHeader
					shouldRender={monitors?.length > 0 && !monitorsAreLoading}
					monitorCount={totalMonitors}
					heading={"Uptime monitors"}
				></MonitorCountHeader>
				<SearchComponent
					monitors={monitors}
					onSearchChange={setSearch}
					setIsSearching={setIsSearching}
				/>
			</Stack>
			<UptimeDataTable
				isAdmin={isAdmin}
				isLoading={monitorsAreLoading}
				filteredMonitors={filteredMonitors}
				monitors={monitors}
				monitorCount={totalMonitors}
				sort={sort}
				setSort={setSort}
				setSearch={setSearch}
				isSearching={isSearching}
				monitorsAreLoading={monitorsAreLoading}
				triggerUpdate={triggerUpdate}
			/>
			<Pagination
				itemCount={totalMonitors}
				paginationLabel="monitors"
				page={page}
				rowsPerPage={rowsPerPage}
				handleChangePage={handleChangePage}
				handleChangeRowsPerPage={handleChangeRowsPerPage}
			/>
		</Stack>
	);
};

export default UptimeMonitors;

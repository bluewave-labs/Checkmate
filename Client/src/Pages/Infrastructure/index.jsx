import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { /* useDispatch, */ useSelector } from "react-redux";
import { useTheme } from "@emotion/react";
import useUtils from "../Uptime/Home/Hooks/useUtils.jsx";
import { jwtDecode } from "jwt-decode";
import SkeletonLayout from "./skeleton";
import Fallback from "../../Components/Fallback";
// import GearIcon from "../../Assets/icons/settings-bold.svg?react";
import CPUChipIcon from "../../assets/icons/cpu-chip.svg?react";
import DataTable from "../../Components/Table";
import { Box, Button, IconButton, Stack } from "@mui/material";
import Breadcrumbs from "../../Components/Breadcrumbs";
import { StatusLabel } from "../../Components/Label";
import { Heading } from "../../Components/Heading";
import Pagination from "../../Components/Table/TablePagination/index.jsx";
// import { getInfrastructureMonitorsByTeamId } from "../../Features/InfrastructureMonitors/infrastructureMonitorsSlice";
import { networkService } from "../../Utils/NetworkService.js";
import CustomGauge from "../../Components/Charts/CustomGauge/index.jsx";
import Host from "../Uptime/Home/Components/Host";
import { useIsAdmin } from "../../Hooks/useIsAdmin.js";
import { InfrastructureMenu } from "./components/Menu";

const BREADCRUMBS = [{ name: `infrastructure`, path: "/infrastructure" }];

/**
 * This is the Infrastructure monitoring page. This is a work in progress
 *
 * @param  - Define params.
 * @returns {JSX.Element} The infrastructure monitoring page.
 */

function Infrastructure() {
	/* Adding this custom hook so we can avoid using the HOC approach that can lower performance (we are calling the admin logic N times on initializing the project. using a custom hook will cal it ass needed ) */
	const isAdmin = useIsAdmin();
	const theme = useTheme();
	const [isLoading, setIsLoading] = useState(true);

	const navigate = useNavigate();
	const navigateToCreate = () => navigate("/infrastructure/create");

	const [page, setPage] = useState(0);
	/* TODO refactor this, so it is not aware of the MUI implementation. First argument only exists because of MUI. This should require onlu the new page. Adapting for MUI should happen inside of table pagination component */
	const handleChangePage = (_, newPage) => {
		setPage(newPage);
	};

	const [rowsPerPage, setRowsPerPage] = useState(5);
	const handleChangeRowsPerPage = (event) => {
		setRowsPerPage(parseInt(event.target.value));
		setPage(0);
	};
	const [monitors, setMonitors] = useState([]);
	const [summary, setSummary] = useState({});

	const { authToken } = useSelector((state) => state.auth);
	const user = jwtDecode(authToken);

	const fetchMonitors = useCallback(async () => {
		try {
			setIsLoading(true);
			const response = await networkService.getMonitorsByTeamId({
				authToken,
				teamId: user.teamId,
				limit: 1,
				types: ["hardware"],
				page: page,
				rowsPerPage: rowsPerPage,
			});
			setMonitors(response?.data?.data?.filteredMonitors ?? []);
			setSummary(response?.data?.data?.summary ?? {});
		} catch (error) {
			console.error(error);
		} finally {
			setIsLoading(false);
		}
	}, [page, rowsPerPage, authToken, user.teamId]);

	useEffect(() => {
		fetchMonitors();
	}, [fetchMonitors]);

	const { determineState } = useUtils();
	// do it here
	function openDetails(id) {
		navigate(`/infrastructure/${id}`);
	}
	function handleActionMenuDelete() {
		fetchMonitors();
	}

	const headers = [
		{
			id: "host",
			content: "Host",
			render: (row) => (
				<Host
					title={row.name}
					url={row.url}
					percentage={row.uptimePercentage}
					percentageColor={row.percentageColor}
				/>
			),
		},
		{
			id: "status",
			content: "Status",
			render: (row) => (
				<StatusLabel
					status={row.status}
					text={row.status}
				/>
			),
		},
		{
			id: "frequency",
			content: "Frequency",
			render: (row) => (
				<Stack
					direction={"row"}
					justifyContent={"center"}
					alignItems={"center"}
					gap=".25rem"
				>
					<CPUChipIcon
						width={20}
						height={20}
					/>
					{row.processor}
				</Stack>
			),
		},
		{ id: "cpu", content: "CPU", render: (row) => <CustomGauge progress={row.cpu} /> },
		{ id: "mem", content: "Mem", render: (row) => <CustomGauge progress={row.mem} /> },
		{ id: "disk", content: "Disk", render: (row) => <CustomGauge progress={row.disk} /> },
		{
			id: "actions",
			content: "Actions",
			render: (row) => (
				<InfrastructureMenu
					monitor={row}
					isAdmin={isAdmin}
					updateCallback={handleActionMenuDelete}
				/>
			),
		},
	];

	const monitorsAsRows = monitors.map((monitor) => {
		const processor =
			((monitor.checks[0]?.cpu?.frequency ?? 0) / 1000).toFixed(2) + " GHz";
		const cpu = (monitor?.checks[0]?.cpu.usage_percent ?? 0) * 100;
		const mem = (monitor?.checks[0]?.memory.usage_percent ?? 0) * 100;
		const disk = (monitor?.checks[0]?.disk[0]?.usage_percent ?? 0) * 100;
		const status = determineState(monitor);
		const uptimePercentage = ((monitor?.uptimePercentage ?? 0) * 100)
			.toFixed(2)
			.toString();
		const percentageColor = monitor.uptimePercentage < 0.25
			? theme.palette.error.main
			: monitor.uptimePercentage < 0.5
				? theme.palette.warning.main
				: theme.palette.success.main;
				
		return {
			id: monitor._id,
			name: monitor.name,
			url: monitor.url,
			processor,
			cpu,
			mem,
			disk,
			status,
			uptimePercentage,
			percentageColor,
		};
	});

	let isActuallyLoading = isLoading && monitors?.length === 0;
	return (
		<Box
			className="infrastructure-monitor"
			sx={{
				':has(> [class*="fallback__"])': {
					position: "relative",
					border: 1,
					borderColor: theme.palette.primary.lowContrast,
					borderRadius: theme.shape.borderRadius,
					borderStyle: "dashed",
					backgroundColor: theme.palette.primary.main,
					overflow: "hidden",
				},
			}}
		>
			{isActuallyLoading ? (
				<SkeletonLayout />
			) : monitors?.length !== 0 ? (
				<Stack gap={theme.spacing(8)}>
					<Box>
						<Breadcrumbs list={BREADCRUMBS} />
						<Stack
							direction="row"
							justifyContent="end"
							alignItems="center"
							mt={theme.spacing(5)}
						>
							{isAdmin && (
								<Button
									variant="contained"
									color="accent"
									onClick={navigateToCreate}
									sx={{ fontWeight: 500, whiteSpace: "nowrap" }}
								>
									Create new
								</Button>
							)}
						</Stack>
					</Box>
					<Stack
						sx={{
							gap: "1rem",
						}}
					>
						<Stack
							direction="row"
							sx={{
								alignItems: "center",
								gap: ".25rem",
								flexWrap: "wrap",
							}}
						>
							<Heading component="h2">Infrastructure monitors</Heading>
							{/* TODO Same as the one in UptimaDataTable. Create component */}
							<Box
								component="span"
								color={theme.palette.tertiary.contrastText}
								border={2}
								borderColor={theme.palette.accent.main}
								backgroundColor={theme.palette.tertiary.main}
								sx={{
									padding: ".25em .75em",
									borderRadius: "10000px",
									fontSize: "12px",
									fontWeight: 500,
								}}
							>
								{summary?.totalMonitors ?? 0}
							</Box>
						</Stack>

						<DataTable
							config={{
								/* TODO this behavior seems to be repeated. Put it on the root table? */
								rowSX: {
									cursor: "pointer",
									"&:hover td": {
										backgroundColor: theme.palette.tertiary.main,
										transition: "background-color .3s ease",
									},
								},
								onRowClick: (row) => openDetails(row.id),
							}}
							headers={headers}
							data={monitorsAsRows}
						/>

						<Pagination
							itemCount={summary?.totalMonitors ?? 0}
							paginationLabel="monitors"
							page={page}
							rowsPerPage={rowsPerPage}
							handleChangePage={handleChangePage}
							handleChangeRowsPerPage={handleChangeRowsPerPage}
						/>
					</Stack>
				</Stack>
			) : (
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
			)}
		</Box>
	);
}

export { Infrastructure };

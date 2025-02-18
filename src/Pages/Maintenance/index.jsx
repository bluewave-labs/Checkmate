import { Box, Stack, Button } from "@mui/material";
import { useTheme } from "@emotion/react";
import Fallback from "../../Components/Fallback";
import { useState, useEffect } from "react";
import "./index.css";
import MaintenanceTable from "./MaintenanceTable";
import { useSelector } from "react-redux";
import { networkService } from "../../main";
import Breadcrumbs from "../../Components/Breadcrumbs";
import { useNavigate } from "react-router-dom";
import { useIsAdmin } from "../../Hooks/useIsAdmin";

const Maintenance = () => {
	const theme = useTheme();
	const navigate = useNavigate();
	const { authToken } = useSelector((state) => state.auth);
	const { rowsPerPage } = useSelector((state) => state.ui.maintenance);
	const isAdmin = useIsAdmin();
	const [maintenanceWindows, setMaintenanceWindows] = useState([]);
	const [maintenanceWindowCount, setMaintenanceWindowCount] = useState(0);
	const [page, setPage] = useState(0);
	const [sort, setSort] = useState({});
	const [updateTrigger, setUpdateTrigger] = useState(false);

	const handleActionMenuDelete = () => {
		setUpdateTrigger((prev) => !prev);
	};

	useEffect(() => {
		const fetchMaintenanceWindows = async () => {
			try {
				const response = await networkService.getMaintenanceWindowsByTeamId({
					authToken: authToken,
					page: page,
					rowsPerPage: rowsPerPage,
				});
				const { maintenanceWindows, maintenanceWindowCount } = response.data.data;
				setMaintenanceWindows(maintenanceWindows);
				setMaintenanceWindowCount(maintenanceWindowCount);
			} catch (error) {
				console.log(error);
			}
		};
		fetchMaintenanceWindows();
	}, [authToken, page, rowsPerPage, updateTrigger]);

	return (
		<Box
			className="maintenance table-container"
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
			{maintenanceWindows.length > 0 && (
				<Stack gap={theme.spacing(8)}>
					<Stack
						direction="row"
						justifyContent="space-between"
						alignItems="center"
						mt={theme.spacing(5)}
					>
						<Breadcrumbs list={[{ name: "maintenance", path: "/maintenance" }]} />
						<Button
							variant="contained"
							color="accent"
							onClick={() => {
								navigate("/maintenance/create");
							}}
							sx={{ fontWeight: 500 }}
						>
							Create maintenance window
						</Button>
					</Stack>
					<MaintenanceTable
						page={page}
						setPage={setPage}
						rowsPerPage={rowsPerPage}
						sort={sort}
						setSort={setSort}
						maintenanceWindows={maintenanceWindows}
						maintenanceWindowCount={maintenanceWindowCount}
						updateCallback={handleActionMenuDelete}
					/>
				</Stack>
			)}
			{maintenanceWindows.length === 0 && (
				<Fallback
					title="maintenance window"
					checks={[
						"Mark your maintenance periods",
						"Eliminate any misunderstandings",
						"Stop sending alerts in maintenance windows",
					]}
					link="/maintenance/create"
					isAdmin={isAdmin}
				/>
			)}
		</Box>
	);
};

export default Maintenance;

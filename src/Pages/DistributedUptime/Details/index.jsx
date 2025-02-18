//Components
import DistributedUptimeMap from "./Components/DistributedUptimeMap";
import Breadcrumbs from "../../../Components/Breadcrumbs";
import { Stack, Typography } from "@mui/material";
import DeviceTicker from "./Components/DeviceTicker";
import ResponseTimeChart from "./Components/DistributedUptimeResponseChart";
import NextExpectedCheck from "./Components/NextExpectedCheck";
import Footer from "./Components/Footer";
import StatBoxes from "./Components/StatBoxes";
import MonitorHeader from "./Components/MonitorHeader";
import MonitorTimeFrameHeader from "../../../Components/MonitorTimeFrameHeader";
import GenericFallback from "../../../Components/GenericFallback";
import MonitorCreateHeader from "../../../Components/MonitorCreateHeader";
import SkeletonLayout from "./Components/Skeleton";
import ControlsHeader from "./Components/ControlsHeader";
import Dialog from "../../../Components/Dialog";
//Utils
import { useTheme } from "@mui/material/styles";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { useIsAdmin } from "../../../Hooks/useIsAdmin";
import { useSubscribeToDetails } from "./Hooks/useSubscribeToDetails";
import { useDeleteMonitor } from "./Hooks/useDeleteMonitor";
import { useNavigate } from "react-router-dom";

const DistributedUptimeDetails = () => {
	const { monitorId } = useParams();
	// Local State
	const [dateRange, setDateRange] = useState("day");
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);

	// Utils
	const theme = useTheme();
	const isAdmin = useIsAdmin();
	const navigate = useNavigate();
	const [isLoading, networkError, connectionStatus, monitor, lastUpdateTrigger] =
		useSubscribeToDetails({ monitorId, dateRange });

	const [deleteMonitor, isDeleting] = useDeleteMonitor({ monitorId });
	// Constants
	const BREADCRUMBS = [
		{ name: "Distributed Uptime", path: "/distributed-uptime" },
		{ name: "Details", path: `/distributed-uptime/${monitorId}` },
	];

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
					Network error
				</Typography>
				<Typography>Please check your connection</Typography>
			</GenericFallback>
		);
	}
	if (
		typeof monitor === "undefined" ||
		typeof monitor?.totalChecks === "undefined" ||
		monitor?.totalChecks === 0
	) {
		return (
			<Stack gap={theme.spacing(10)}>
				<Breadcrumbs list={BREADCRUMBS} />
				<GenericFallback>
					<Typography>There is no check history for this monitor yet.</Typography>
				</GenericFallback>
			</Stack>
		);
	}

	return (
		<Stack
			direction="column"
			gap={theme.spacing(10)}
		>
			<Breadcrumbs list={BREADCRUMBS} />
			<MonitorCreateHeader
				label="Create status page"
				isAdmin={isAdmin}
				path={`/status/distributed/create/${monitorId}`}
			/>
			<ControlsHeader
				isDeleting={isDeleting}
				isDeleteOpen={isDeleteOpen}
				setIsDeleteOpen={setIsDeleteOpen}
				monitorId={monitorId}
			/>
			<MonitorHeader monitor={monitor} />
			<StatBoxes
				monitor={monitor}
				lastUpdateTrigger={lastUpdateTrigger}
			/>
			<NextExpectedCheck
				lastUpdateTime={monitor?.timeSinceLastCheck ?? 0}
				interval={monitor?.interval ?? 0}
				trigger={lastUpdateTrigger}
			/>
			<MonitorTimeFrameHeader
				dateRange={dateRange}
				setDateRange={setDateRange}
			/>

			<ResponseTimeChart checks={monitor?.groupedChecks ?? []} />
			<Stack
				direction="row"
				gap={theme.spacing(8)}
			>
				<DistributedUptimeMap
					checks={monitor?.groupedMapChecks ?? []}
					height={"100%"}
					width={"100%"}
				/>
				<DeviceTicker
					width={"25vw"}
					data={monitor?.latestChecks ?? []}
					connectionStatus={connectionStatus}
				/>
			</Stack>
			<Footer />
			<Dialog
				title="Do you want to delete this monitor?"
				onConfirm={() => {
					deleteMonitor();
					setIsDeleteOpen(false);
					navigate("/distributed-uptime");
				}}
				onCancel={() => {
					setIsDeleteOpen(false);
				}}
				open={isDeleteOpen}
				confirmationButtonLabel="Yes, delete monitor"
				description="Once deleted, your monitor cannot be retrieved."
				isLoading={isDeleting || isLoading}
			/>
		</Stack>
	);
};

export default DistributedUptimeDetails;

//Components
import DistributedUptimeMap from "../../DistributedUptime/Details/Components/DistributedUptimeMap";
import Breadcrumbs from "../../../Components/Breadcrumbs";
import { Stack, Typography } from "@mui/material";
import DeviceTicker from "../../DistributedUptime/Details/Components/DeviceTicker";
import DistributedUptimeResponseChart from "../../DistributedUptime/Details/Components/DistributedUptimeResponseChart";
import NextExpectedCheck from "../../DistributedUptime/Details/Components/NextExpectedCheck";
import Footer from "../../DistributedUptime/Details/Components/Footer";
import StatBoxes from "../../DistributedUptime/Details/Components/StatBoxes";
import ControlsHeader from "../../StatusPage/Status/Components/ControlsHeader";
import MonitorTimeFrameHeader from "../../../Components/MonitorTimeFrameHeader";
import GenericFallback from "../../../Components/GenericFallback";
import Dialog from "../../../Components/Dialog";
import SkeletonLayout from "./Components/Skeleton";
import StatBox from "../../../Components/StatBox";
import UptLogo from "../../../assets/icons/upt_logo.png";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import InfoBox from "../../../Components/InfoBox";

//Utils
import { useTheme } from "@mui/material/styles";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { useSubscribeToDetails } from "../../DistributedUptime/Details/Hooks/useSubscribeToDetails";
import { useStatusPageFetchByUrl } from "./Hooks/useStatusPageFetchByUrl";
import { useStatusPageDelete } from "../../StatusPage/Status/Hooks/useStatusPageDelete";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
const DistributedUptimeStatus = () => {
	const { url } = useParams();
	const location = useLocation();
	const isPublic = location.pathname.startsWith("/status/distributed/public");

	// Local State
	const [dateRange, setDateRange] = useState("day");
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);
	// Utils
	const theme = useTheme();
	const navigate = useNavigate();
	const [
		statusPageIsLoading,
		statusPageNetworkError,
		statusPage,
		monitorId,
		isPublished,
	] = useStatusPageFetchByUrl({
		url,
	});

	const [isLoading, networkError, connectionStatus, monitor, lastUpdateTrigger] =
		useSubscribeToDetails({ monitorId, dateRange, isPublic, isPublished });

	const [deleteStatusPage, isDeleting] = useStatusPageDelete(() => {
		navigate("/distributed-uptime");
	}, url);
	// Constants
	const BREADCRUMBS = [
		{ name: "Distributed Uptime", path: "/distributed-uptime" },
		{ name: "details", path: `/distributed-uptime/${monitorId}` },
		{ name: "status", path: `` },
	];

	let sx = {};
	if (isPublic) {
		sx = {
			paddingTop: "10vh",
			paddingRight: "10vw",
			paddingBottom: "10vh",
			paddingLeft: "10vw",
		};
	}

	// Done loading, a status page doesn't exist
	if (!statusPageIsLoading && typeof statusPage === "undefined") {
		return (
			<Stack sx={sx}>
				<GenericFallback>
					<Typography
						variant="h1"
						marginY={theme.spacing(4)}
						color={theme.palette.primary.contrastTextTertiary}
					>
						A status page is not set up.
					</Typography>
					<Typography>Please contact your administrator</Typography>
				</GenericFallback>
			</Stack>
		);
	}

	// Done loading, a status page exists but is not public
	if (!statusPageIsLoading && isPublic && statusPage.isPublished === false) {
		return (
			<Stack sx={sx}>
				<GenericFallback>
					<Typography>This status page is not public.</Typography>
				</GenericFallback>
			</Stack>
		);
	}

	if (isLoading || statusPageIsLoading) {
		return <SkeletonLayout />;
	}

	if (networkError || statusPageNetworkError) {
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
		typeof statusPage === "undefined" ||
		typeof monitor === "undefined" ||
		monitor.totalChecks === 0
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
			sx={sx}
		>
			{!isPublic && <Breadcrumbs list={BREADCRUMBS} />}
			<ControlsHeader
				shouldShow={!isPublic}
				statusPage={statusPage}
				isDeleting={isDeleting}
				isDeleteOpen={isDeleteOpen}
				setIsDeleteOpen={setIsDeleteOpen}
				url={url}
				type="distributed"
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
			<Stack
				direction="row"
				gap={theme.spacing(8)}
			>
				<DistributedUptimeMap
					checks={monitor?.groupedMapChecks ?? []}
					height={"100%"}
					width={"50%"}
				/>
				<Stack
					width={"50%"}
					gap={theme.spacing(8)}
				>
					<Stack
						direction="row"
						gap={theme.spacing(8)}
					>
						<InfoBox
							heading="Devices"
							subHeading={monitor?.totalChecks ?? 0}
							icon={PeopleAltOutlinedIcon}
							alt="Upt Logo"
							sx={{ width: "50%" }}
						/>
						<InfoBox
							heading="UPT Burned"
							subHeading={monitor?.totalUptBurnt ?? 0}
							img={UptLogo}
							alt="Upt Logo"
							sx={{ width: "50%" }}
						/>
					</Stack>

					<DeviceTicker
						data={monitor?.latestChecks ?? []}
						connectionStatus={connectionStatus}
					/>
				</Stack>
			</Stack>
			<DistributedUptimeResponseChart checks={monitor?.groupedChecks ?? []} />
			<StatBoxes
				monitor={monitor}
				lastUpdateTrigger={lastUpdateTrigger}
			/>
			<Footer />
			<Dialog
				// open={isOpen.deleteStats}
				title="Do you want to delete this status page?"
				onConfirm={() => {
					deleteStatusPage();
					setIsDeleteOpen(false);
				}}
				onCancel={() => {
					setIsDeleteOpen(false);
				}}
				open={isDeleteOpen}
				confirmationButtonLabel="Yes, delete status page"
				description="Once deleted, your status page cannot be retrieved."
				isLoading={isDeleting || isLoading}
			/>
		</Stack>
	);
};

export default DistributedUptimeStatus;

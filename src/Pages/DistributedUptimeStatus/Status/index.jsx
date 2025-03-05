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
import UptLogo from "../../../assets/icons/upt_logo.png";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import InfoBox from "../../../Components/InfoBox";
import StatusHeader from "../../DistributedUptime/Details/Components/StatusHeader";
import MonitorsList from "./Components/MonitorsList";
import { RowContainer } from "../../../Components/StandardContainer";

//Utils
import { useTheme } from "@mui/material/styles";
import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useSubscribeToDetails } from "../../DistributedUptime/Details/Hooks/useSubscribeToDetails";
import { useDUStatusPageFetchByUrl } from "./Hooks/useDUStatusPageFetchByUrl";
import { useStatusPageDelete } from "../../StatusPage/Status/Hooks/useStatusPageDelete";
import TimeFrameHeader from "./Components/TimeframeHeader";
import SubHeader from "../../../Components/Subheader";
import { safelyParseFloat } from "../../../Utils/utils";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";
import { setMode } from "../../../Features/UI/uiSlice";

// Responsive
import { useMediaQuery } from "@mui/material";

const DistributedUptimeStatus = () => {
	const { url } = useParams();
	const location = useLocation();
	const { t } = useTranslation();
	const isPublic = location.pathname.startsWith("/status/distributed/public");
	const elementToCapture = useRef(null);

	// Redux state
	const mode = useSelector((state) => state.ui.mode);
	const originalModeRef = useRef(null);

	// Local State
	const [dateRange, setDateRange] = useState("recent");
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);
	const [timeFrame, setTimeFrame] = useState(30);
	// Utils
	const theme = useTheme();
	const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
	const navigate = useNavigate();
	const dispatch = useDispatch();

	const [
		statusPageIsLoading,
		statusPageNetworkError,
		statusPage,
		monitorId,
		isPublished,
	] = useDUStatusPageFetchByUrl({
		url,
		timeFrame,
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

	// Default to dark mode
	useEffect(() => {
		const cleanup = () => {
			if (originalModeRef.current === null) {
				originalModeRef.current = mode;
			}

			if (isPublic) {
				dispatch(setMode(originalModeRef.current));
			}
		};

		if (isPublic) {
			dispatch(setMode("dark"));
		}

		window.addEventListener("beforeunload", cleanup);
		return () => {
			window.removeEventListener("beforeunload", cleanup);
		};
	}, [dispatch, isPublic]);

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
			ref={elementToCapture}
			direction="column"
			gap={theme.spacing(10)}
			sx={{
				...sx,
			}}
		>
			{!isPublic && <Breadcrumbs list={BREADCRUMBS} />}

			<ControlsHeader
				statusPage={statusPage}
				isPublic={isPublic}
				isDeleting={isDeleting}
				isDeleteOpen={isDeleteOpen}
				setIsDeleteOpen={setIsDeleteOpen}
				url={url}
				type="distributed"
			/>
			<StatusHeader
				monitor={monitor}
				connectionStatus={connectionStatus}
				elementToCapture={elementToCapture}
			/>

			<SubHeader
				direction={{ s: "column", md: "row" }}
				headerText={t("distributedStatusHeaderText")}
				subHeaderText={t("distributedStatusSubHeaderText")}
				gap={isSmallScreen ? theme.spacing(10) : 0}
				alignItems={{ s: "flex-start", md: "flex-end" }}
			>
				<RowContainer>
					<Stack>
						<Typography variant={`body2`}>
							{t("distributedRightCategoryTitle")}
						</Typography>
						<Typography variant={`h2`}>{statusPage.companyName}</Typography>
					</Stack>
				</RowContainer>
			</SubHeader>

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
				gap={theme.spacing(8)}
				direction={{ s: "column", md: "row" }}
			>
				<DistributedUptimeMap
					checks={monitor?.groupedMapChecks ?? []}
					width={isSmallScreen ? "100%" : "50%"}
				/>
				<Stack
					width={{ s: "100%", md: "50%" }}
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
							heading={isSmallScreen ? "UPT" : "UPT Burned"}
							subHeading={safelyParseFloat(monitor?.totalUptBurnt).toFixed(4)}
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

			<SubHeader
				shouldRender={statusPage?.subMonitors?.length > 0}
				direction={{ s: "column", md: "row" }}
				headerText={t("distributedStatusServerMonitors")}
				subHeaderText={t("distributedStatusServerMonitorsDescription")}
				gap={isSmallScreen ? theme.spacing(10) : 0}
				alignItems={{ s: "flex-start", md: "flex-end" }}
			>
				<TimeFrameHeader
					timeFrame={timeFrame}
					setTimeFrame={setTimeFrame}
					alignSelf="flex-start"
				/>
			</SubHeader>

			<MonitorsList
				monitors={statusPage?.subMonitors}
				timeFrame={timeFrame}
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

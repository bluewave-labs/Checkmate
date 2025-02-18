// Components
import { Stack, Typography } from "@mui/material";
import Breadcrumbs from "../../../Components/Breadcrumbs";
import Fallback from "../../../Components/Fallback";
import MonitorCreateHeader from "../../../Components/MonitorCreateHeader";
import GenericFallback from "../../../Components/GenericFallback";
import StatusPagesTable from "./Components/StatusPagesTable";
import SkeletonLayout from "../../../Components/Skeletons/FullPage";
// Utils
import { useTheme } from "@emotion/react";
import { useStatusPagesFetch } from "./Hooks/useStatusPagesFetch";
import { useIsAdmin } from "../../../Hooks/useIsAdmin";
const BREADCRUMBS = [{ name: `Status Pages`, path: "" }];

const StatusPages = () => {
	// Utils
	const theme = useTheme();
	const isAdmin = useIsAdmin();
	const [isLoading, networkError, statusPages] = useStatusPagesFetch();

	if (isLoading) {
		return <SkeletonLayout />;
	}

	if (networkError === true) {
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

	if (!isLoading && typeof statusPages !== "undefined" && statusPages.length === 0) {
		return (
			<Fallback
				title="status page"
				checks={[
					"Monitor and display the health of your services in real time",
					"Track multiple services and share their status",
					"Keep users informed about outages and performance",
				]}
				link="/status/uptime/create"
				isAdmin={isAdmin}
			/>
		);
	}
	return (
		<Stack gap={theme.spacing(10)}>
			<Breadcrumbs list={BREADCRUMBS} />
			<MonitorCreateHeader
				label="Create status page"
				isAdmin={isAdmin}
				path="/status/uptime/create"
			/>
			<StatusPagesTable data={statusPages} />
		</Stack>
	);
};

export default StatusPages;

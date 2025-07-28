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
import { useTranslation } from "react-i18next";
import { useStatusPagesFetch } from "./Hooks/useStatusPagesFetch";
import { useIsAdmin } from "../../../Hooks/useIsAdmin";
const BREADCRUMBS = [{ name: `Status Pages`, path: "" }];

const StatusPages = () => {
	// Utils
	const theme = useTheme();
	const { t } = useTranslation();
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
					{t("common.toasts.networkError")}
				</Typography>
				<Typography>{t("common.toasts.checkConnection")}</Typography>
			</GenericFallback>
		);
	}

	if (!isLoading && typeof statusPages !== "undefined" && statusPages.length === 0) {
		return (
			<Fallback
				title={t("statusPage.fallback.title")}
				checks={t("statusPage.fallback.checks", { returnObjects: true })}
				type="statusPage"
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
				isLoading={isLoading}
			/>
			<StatusPagesTable data={statusPages} />
		</Stack>
	);
};

export default StatusPages;

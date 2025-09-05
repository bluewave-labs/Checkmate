// Components
import { Stack } from "@mui/material";
import Breadcrumbs from "../../../Components/Breadcrumbs";
import MonitorCreateHeader from "../../../Components/MonitorCreateHeader";
import StatusPagesTable from "./Components/StatusPagesTable";
import PageStateWrapper from "../../../Components/PageStateWrapper";
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

	return (
		<>
			<PageStateWrapper
				networkError={networkError}
				isLoading={isLoading}
				items={statusPages}
				type="statusPage"
				fallbackLink="/status/uptime/create"
			>
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
			</PageStateWrapper>
		</>
	);
};

export default StatusPages;

import { BasePageWithStates } from "@/Components/v2/design-elements";
import { StatusPagesTable } from "./Components/StatusPagesTable";
import { useGet } from "@/Hooks/UseApi";
import type { StatusPage } from "@/Types/StatusPage";
import { useTranslation } from "react-i18next";
import { HeaderCreate } from "@/Components/v2/common";
import { useIsAdmin } from "@/Hooks/useIsAdmin";

const StatusPages = () => {
	const { t } = useTranslation();

	const {
		data: statusPages,
		isLoading,
		error,
	} = useGet<StatusPage[]>("/status-page/team");

	const isAdmin = useIsAdmin();

	return (
		<BasePageWithStates
			page={t("pages.statusPages.title")}
			loading={isLoading}
			bullets={
				t("pages.statusPages.fallback.checks", { returnObjects: true }) as string[]
			}
			error={!!error}
			items={statusPages ?? []}
			actionButtonText={t("pages.statusPages.fallback.actionButton")}
			actionLink="/status/create"
		>
			<HeaderCreate
				path="/status/create"
				isAdmin={isAdmin}
			/>
			<StatusPagesTable data={statusPages ?? []} />
		</BasePageWithStates>
	);
};

export default StatusPages;

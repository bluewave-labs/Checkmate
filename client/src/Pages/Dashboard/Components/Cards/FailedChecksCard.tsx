import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";

import { useGet } from "@/Hooks/UseApi";
import { LAYOUT } from "@/Utils/Theme/constants";
import { DashboardCard, CardMessage } from "../DashboardCard";
import { CardBar, CardFigure } from "../CardPrimitives";

import type { ChecksSummary } from "@/Types/Check";

// Day only. `dateRange=week` returns figures identical to `day`, so a range
// selector here would silently lie.
const SUMMARY_URL = "/checks/team/summary?dateRange=day";

export const FailedChecksCard = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	const { data, isLoading, error } = useGet<ChecksSummary>(SUMMARY_URL);

	const total = data?.totalChecks ?? 0;
	const failed = data?.downChecks ?? 0;
	const percentage = total > 0 ? (failed / total) * 100 : 0;
	const color = percentage > 10 ? theme.palette.error.main : theme.palette.success.main;

	return (
		<DashboardCard
			title={t("pages.dashboard.cards.failedChecks.title")}
			to="/checks"
			isLoading={isLoading && !data}
			error={error}
		>
			{total === 0 ? (
				<CardMessage text={t("pages.dashboard.cards.failedChecks.empty")} />
			) : (
				<Stack gap={theme.spacing(LAYOUT.SM)}>
					<CardFigure
						value={`${percentage.toFixed(1)}%`}
						caption={t("pages.dashboard.cards.failedChecks.ratio", {
							failed: failed.toLocaleString(),
							total: total.toLocaleString(),
						})}
						color={color}
					/>
					<CardBar
						value={percentage}
						color={color}
					/>
				</Stack>
			)}
		</DashboardCard>
	);
};

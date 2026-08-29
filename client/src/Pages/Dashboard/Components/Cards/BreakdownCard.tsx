import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";

import { LAYOUT } from "@/Utils/Theme/constants";
import { typographyLevels } from "@/Utils/Theme/Palette";
import { DashboardCard, CardMessage } from "../DashboardCard";
import { CardMeterRow, CardRow } from "../CardPrimitives";

export interface BreakdownBucket {
	/** Stable key and displayed label. */
	key: string;
	label: string;
	total: number;
	down: number;
	/** Where the row links to, if anywhere. */
	to?: string;
}

/**
 * "How the fleet splits by X" — one proportional row per bucket, flagging any
 * bucket with something down. Monitors by type and Monitors by group are the
 * same card over different keys, so they share this shell.
 */
export const BreakdownCard = ({
	titleKey,
	emptyKey,
	to,
	buckets,
	isLoading,
	isStale,
	error,
}: {
	titleKey: string;
	emptyKey: string;
	to?: string;
	buckets: BreakdownBucket[];
	isLoading?: boolean;
	isStale?: boolean;
	error?: unknown;
}) => {
	const theme = useTheme();
	const { t } = useTranslation();

	// Bars are relative to the largest bucket, not to the total, so a fleet of
	// one dominant type still shows readable proportions.
	const max = buckets[0]?.total ?? 0;

	return (
		<DashboardCard
			title={t(titleKey)}
			to={to}
			isLoading={isLoading}
			error={error}
			isStale={isStale}
		>
			{buckets.length === 0 ? (
				<CardMessage text={t(emptyKey)} />
			) : (
				<Stack gap={theme.spacing(LAYOUT.SM)}>
					{buckets.map((bucket) => (
						<CardRow
							key={bucket.key}
							to={bucket.to}
						>
							<CardMeterRow
								label={bucket.label}
								value={bucket.total}
								max={max}
								color={
									bucket.down > 0 ? theme.palette.error.main : theme.palette.primary.main
								}
								trailing={
									<Stack
										direction="row"
										alignItems="center"
										gap={theme.spacing(LAYOUT.XS)}
										flexShrink={0}
									>
										{bucket.down > 0 && (
											<Typography
												fontSize={typographyLevels.m}
												color={theme.palette.error.main}
											>
												{t("pages.dashboard.cards.monitorsByType.down", {
													count: bucket.down,
												})}
											</Typography>
										)}
										<Typography
											fontSize={typographyLevels.m}
											color={theme.palette.text.secondary}
										>
											{bucket.total}
										</Typography>
									</Stack>
								}
							/>
						</CardRow>
					))}
				</Stack>
			)}
		</DashboardCard>
	);
};

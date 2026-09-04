import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Dot } from "@/Components/design-elements";

// Hooks
import { useEffect, useState } from "react";
import { useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";

// Utils
import { LAYOUT, SPACING } from "@/Utils/Theme/constants";
import { MS_PER_SECOND, MS_PER_MINUTE } from "@/Utils/TimeUtils";

interface HeaderLogsProps {
	lines: number;
	loading: boolean;
	lastUpdatedAt: number | null;
}

export const HeaderLogs = ({ lines, loading, lastUpdatedAt }: HeaderLogsProps) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const [now, setNow] = useState(() => Date.now());

	useEffect(() => {
		if (lastUpdatedAt === null) return;
		setNow(Date.now());
		const id = window.setInterval(() => setNow(Date.now()), MS_PER_SECOND);
		return () => window.clearInterval(id);
	}, [lastUpdatedAt]);

	const renderStatus = () => {
		if (loading) return t("pages.docker.container.logs.loading");
		if (lastUpdatedAt === null) return null;
		const ageMs = Math.max(0, now - lastUpdatedAt);
		return ageMs < MS_PER_MINUTE
			? t("pages.docker.container.logs.updatedSecondsAgo", {
					count: Math.floor(ageMs / MS_PER_SECOND),
				})
			: t("pages.docker.container.logs.updatedMinutesAgo", {
					count: Math.floor(ageMs / MS_PER_MINUTE),
				});
	};

	return (
		<Stack
			direction="row"
			alignItems="center"
			gap={LAYOUT.MD}
		>
			<Typography>
				{t("pages.docker.container.logs.recentLines", { count: lines })}
			</Typography>
			<Stack
				direction="row"
				alignItems="center"
				gap={SPACING.SM}
			>
				{lastUpdatedAt !== null && !loading && (
					<Dot
						color={theme.palette.success.main}
						size="md"
					/>
				)}
				<Typography color={theme.palette.text.secondary}>{renderStatus()}</Typography>
			</Stack>
		</Stack>
	);
};

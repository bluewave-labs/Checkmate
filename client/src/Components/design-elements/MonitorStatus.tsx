import type { Monitor } from "@/Types/Monitor";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { PulseDot, Dot, StrategyBadge } from "@/Components/design-elements";
import { getStatusColor, formatUrl } from "@/Utils/MonitorUtils";
import { useTheme } from "@mui/material/styles";
import prettyMilliseconds from "pretty-ms";
import { typographyLevels } from "@/Utils/Theme/Palette";
import useMediaQuery from "@mui/material/useMediaQuery";
import { LAYOUT } from "@/Utils/Theme/constants";
export const MonitorStatus = ({ monitor }: { monitor: Monitor }) => {
	const theme = useTheme();
	const isSmall = useMediaQuery(theme.breakpoints.down("md"));

	if (!monitor) {
		return null;
	}
	return (
		<Stack>
			<Typography
				fontSize={typographyLevels.xl}
				fontWeight={500}
				overflow={"hidden"}
				textOverflow={"ellipsis"}
				whiteSpace={"nowrap"}
			>
				{monitor.name}
			</Typography>
			<Stack
				direction="row"
				alignItems={"center"}
				gap={theme.spacing(LAYOUT.XS)}
			>
				<PulseDot color={getStatusColor(monitor.status, theme)} />
				<Typography
					fontSize={typographyLevels.l}
					fontWeight={"bolder"}
					fontFamily={"monospace"}
					overflow={"hidden"}
					textOverflow={"ellipsis"}
					whiteSpace={"nowrap"}
				>
					{formatUrl(monitor?.url)}
				</Typography>
				{monitor.type === "pagespeed" && monitor.strategy && (
					<>
						<Dot />
						<StrategyBadge strategy={monitor.strategy} />
					</>
				)}
				{!isSmall && (
					<>
						<Dot />
						<Typography>
							Checking every {prettyMilliseconds(monitor?.interval, { verbose: true })}
						</Typography>
					</>
				)}
			</Stack>
		</Stack>
	);
};

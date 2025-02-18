import { Stack, Typography, List, ListItem } from "@mui/material";
import { useTheme } from "@emotion/react";
import PulseDot from "../../../../../Components/Animated/PulseDot";
import "flag-icons/css/flag-icons.min.css";

const BASE_BOX_PADDING_VERTICAL = 16;
const BASE_BOX_PADDING_HORIZONTAL = 8;

const DeviceTicker = ({ data, width = "100%", connectionStatus }) => {
	const theme = useTheme();
	const statusColor = {
		up: theme.palette.success.main,
		down: theme.palette.error.main,
	};

	return (
		<Stack
			direction="column"
			gap={theme.spacing(2)}
			width={width}
			sx={{
				padding: `${theme.spacing(BASE_BOX_PADDING_VERTICAL)} ${theme.spacing(BASE_BOX_PADDING_HORIZONTAL)}`,
				backgroundColor: theme.palette.background.main,
				border: 1,
				borderStyle: "solid",
				borderColor: theme.palette.primary.lowContrast,
			}}
		>
			<Stack
				direction="row"
				justifyContent={"center"}
				gap={theme.spacing(4)}
			>
				<PulseDot color={statusColor[connectionStatus]} />

				<Typography
					variant="h1"
					mb={theme.spacing(8)}
					sx={{ alignSelf: "center" }}
				>
					{connectionStatus === "up" ? "Connected" : "No connection"}
				</Typography>
			</Stack>
			<List>
				{data.slice(Math.max(data.length - 5, 0)).map((dataPoint) => {
					const countryCode = dataPoint?.countryCode?.toLowerCase() ?? null;
					const flag = countryCode ? `fi fi-${countryCode}` : null;
					return (
						<ListItem key={Math.random()}>
							<Stack direction="column">
								<Stack
									direction="row"
									alignItems="center"
									gap={theme.spacing(4)}
								>
									{flag && <span className={flag} />}
									<Typography variant="h2">{dataPoint?.city || "Unknown"}</Typography>
								</Stack>
								<Typography variant="p">{`Response time: ${Math.floor(dataPoint?.responseTime ?? 0)} ms`}</Typography>
								<Typography variant="p">{`UPT burned: ${dataPoint.uptBurnt}`}</Typography>
								<Typography variant="p">{`${dataPoint?.device?.manufacturer} ${dataPoint?.device?.model}`}</Typography>
							</Stack>
						</ListItem>
					);
				})}
			</List>
		</Stack>
	);
};

export default DeviceTicker;

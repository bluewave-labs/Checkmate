import { Stack, Typography } from "@mui/material";
import { useTheme } from "@emotion/react";
import PulseDot from "../../../../../Components/Animated/PulseDot";
import "flag-icons/css/flag-icons.min.css";
import { ColContainer } from "../../../../../Components/StandardContainer";

const BASE_BOX_PADDING_VERTICAL = 16;
const BASE_BOX_PADDING_HORIZONTAL = 8;

const DeviceTicker = ({ data, width = "100%", connectionStatus }) => {
	const theme = useTheme();
	const statusColor = {
		up: theme.palette.success.main,
		down: theme.palette.error.main,
	};

	return (
		<ColContainer>
			<Stack
				direction="row"
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
			<table>
				<thead>
					<tr>
						<th style={{ textAlign: "left" }}>
							<Typography>COUNTRY</Typography>
						</th>
						<th style={{ textAlign: "left" }}>
							<Typography>CITY</Typography>
						</th>
						<th style={{ textAlign: "right" }}>
							<Typography>RESPONSE</Typography>
						</th>
						<th style={{ textAlign: "right" }}>
							<Typography>UPT BURNED</Typography>
						</th>
					</tr>
				</thead>
				<tbody>
					{data.map((dataPoint) => {
						const countryCode = dataPoint?.countryCode?.toLowerCase() ?? null;
						const flag = countryCode ? `fi fi-${countryCode}` : null;
						const city = dataPoint?.city !== "" ? dataPoint?.city : "Unknown";
						return (
							<tr key={Math.random()}>
								<td style={{ padding: theme.spacing(4) }}>
									<Typography>
										{flag ? <span className={flag} /> : null}{" "}
										{countryCode?.toUpperCase() ?? "N/A"}
									</Typography>
								</td>
								<td>
									<Typography>{city}</Typography>
								</td>
								<td style={{ textAlign: "right" }}>
									<Typography>{Math.floor(dataPoint.responseTime)} ms</Typography>
								</td>
								<td style={{ textAlign: "right" }}>
									<Typography color={theme.palette.warning.main}>
										+{dataPoint.uptBurnt}
									</Typography>
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</ColContainer>
	);
};

export default DeviceTicker;

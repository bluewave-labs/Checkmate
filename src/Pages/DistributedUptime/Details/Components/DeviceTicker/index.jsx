// Components
import { Stack, Typography } from "@mui/material";
import PulseDot from "../../../../../Components/Animated/PulseDot";
import "flag-icons/css/flag-icons.min.css";
import { ColContainer } from "../../../../../Components/StandardContainer";

// Utils
import { useTheme } from "@emotion/react";
const DeviceTicker = ({ data, width = "100%", connectionStatus }) => {
	const theme = useTheme();

	const statusColor = {
		up: theme.palette.success.main,
		down: theme.palette.error.main,
		undefined: theme.palette.warning.main,
	};

	return (
		<ColContainer sx={{ height: "100%" }}>
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
					{connectionStatus === "up" ? "Connected" : "Connecting..."}
				</Typography>
			</Stack>
			<div
				style={{
					overflowX: "auto",
					maxWidth: "100%",
					// Optional: add a max height if you want vertical scrolling too
					// maxHeight: '400px',
					// overflowY: 'auto'
				}}
			>
				<table style={{ width: "100%" }}>
					<thead>
						<tr>
							<th style={{ textAlign: "left", paddingLeft: theme.spacing(4) }}>
								<Typography>COUNTRY</Typography>
							</th>
							<th style={{ textAlign: "left", paddingLeft: theme.spacing(4) }}>
								<Typography>CITY</Typography>
							</th>
							<th style={{ textAlign: "right", paddingLeft: theme.spacing(4) }}>
								<Typography>RESPONSE</Typography>
							</th>
							<th style={{ textAlign: "right", paddingLeft: theme.spacing(4) }}>
								<Typography sx={{ whiteSpace: "nowrap" }}>{"UPT BURNED"}</Typography>
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
									<td style={{ paddingLeft: theme.spacing(4) }}>
										<Typography>
											{flag ? <span className={flag} /> : null}{" "}
											{countryCode?.toUpperCase() ?? "N/A"}
										</Typography>
									</td>
									<td style={{ paddingLeft: theme.spacing(4) }}>
										<Typography>{city}</Typography>
									</td>
									<td style={{ textAlign: "right", paddingLeft: theme.spacing(4) }}>
										<Typography>{Math.floor(dataPoint.responseTime)} ms</Typography>
									</td>
									<td style={{ textAlign: "right", paddingLeft: theme.spacing(4) }}>
										<Typography color={theme.palette.warning.main}>
											+{dataPoint.uptBurnt}
										</Typography>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
		</ColContainer>
	);
};

export default DeviceTicker;

// Components
import CustomGauge from "../../../../../Components/Charts/CustomGauge";
import BaseContainer from "../BaseContainer";
import { Stack, Typography, Box } from "@mui/material";
// Utils
import { useTheme } from "@emotion/react";
import PropTypes from "prop-types";

const Gauge = ({ value, heading, metricOne, valueOne, metricTwo, valueTwo }) => {
	const theme = useTheme();

	const valueStyle = {
		borderRadius: theme.spacing(2),
		backgroundColor: theme.palette.tertiary.main,
		width: "40%",
		mb: theme.spacing(2),
		mt: theme.spacing(2),
		pr: theme.spacing(2),
		textAlign: 'right'
	}

	return (
		<BaseContainer>
			<Stack
				direction="column"
				gap={theme.spacing(2)}
				alignItems="center"
			>
				<Box
					sx={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						width: "100%",
						backgroundColor: theme.palette.gradient.color1
					}}
				>
					<CustomGauge
						progress={value}
						radius={100}
					/>
					<Typography component="h2" sx={{ fontWeight: 600 }}>{heading}</Typography>
				</Box>
				<Box
					sx={{
						width: "100%",
						borderTop: `1px solid ${theme.palette.primary.lowContrast}`,
					}}
				>
					<Stack
						justifyContent={"space-between"}
						direction="row"
						alignItems="center"
						gap={theme.spacing(2)}
					>
						<Typography>{metricOne}</Typography>
						<Typography sx={valueStyle}>{valueOne}</Typography>
					</Stack>
					<Stack
						justifyContent={"space-between"}
						direction="row"
						alignItems="center"
						gap={theme.spacing(2)}
					>
						<Typography>{metricTwo}</Typography>
						<Typography sx={valueStyle}>{valueTwo}</Typography>
					</Stack>
				</Box>
			</Stack>
		</BaseContainer>
	);
};

Gauge.propTypes = {
	value: PropTypes.number,
	heading: PropTypes.string,
	metricOne: PropTypes.string,
	valueOne: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
	metricTwo: PropTypes.string,
	valueTwo: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
};

export default Gauge;

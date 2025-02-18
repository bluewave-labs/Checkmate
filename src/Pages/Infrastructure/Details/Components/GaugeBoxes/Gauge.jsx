// Components
import CustomGauge from "../../../../../Components/Charts/CustomGauge";
import BaseContainer from "../BaseContainer";
import { Stack, Typography, Box } from "@mui/material";
// Utils
import { useTheme } from "@emotion/react";
import PropTypes from "prop-types";

const Gauge = ({ value, heading, metricOne, valueOne, metricTwo, valueTwo }) => {
	const theme = useTheme();

	return (
		<BaseContainer>
			<Stack
				direction="column"
				gap={theme.spacing(2)}
				alignItems="center"
			>
				<CustomGauge
					progress={value}
					radius={100}
					color={theme.palette.primary.main}
				/>
				<Typography component="h2">{heading}</Typography>
				<Box
					sx={{
						width: "100%",
						borderTop: `1px solid ${theme.palette.primary.lowContrast}`,
					}}
				>
					<Stack
						justifyContent={"space-between"}
						direction="row"
						gap={theme.spacing(2)}
					>
						<Typography>{metricOne}</Typography>
						<Typography>{valueOne}</Typography>
					</Stack>
					<Stack
						justifyContent={"space-between"}
						direction="row"
						gap={theme.spacing(2)}
					>
						<Typography>{metricTwo}</Typography>
						<Typography>{valueTwo}</Typography>
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

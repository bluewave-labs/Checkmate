import PropTypes from "prop-types";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Check from "../Check/Check";
const FallbackCheckList = ({ checks, type }) => {
	const theme = useTheme();
	return (
		<Box
			sx={{
				display: "flex",
				flexWrap: "wrap",
				gap: theme.spacing(2),
				alignItems: "flex-start",
				maxWidth: { xs: "90%", md: "80%", lg: "75%" },
			}}
		>
			{checks?.map((check, index) => (
				<Check
					text={check}
					key={`${type.trim().split(" ")[0]}-${index}`}
					outlined={true}
				/>
			))}
		</Box>
	);
};

FallbackCheckList.propTypes = {
	checks: PropTypes.arrayOf(PropTypes.string).isRequired,
	title: PropTypes.string.isRequired,
	type: PropTypes.string.isRequired,
};

export default FallbackCheckList;

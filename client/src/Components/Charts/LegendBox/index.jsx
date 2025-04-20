import { Stack, Typography } from "@mui/material";
import { useTheme } from "@emotion/react";
import IconBox from "../../IconBox";
import PropTypes from "prop-types";

const LegendBox = ({ children, icon, header, sx }) => {
	const theme = useTheme();
	return (
		<Stack
			direction="column"
			gap={theme.spacing(4)}
			borderRadius={theme.spacing(8)}
			sx={{
				...sx,
				"& label": { pl: theme.spacing(6) },
				borderLeftStyle: "solid",
				borderLeftWidth: 1,
				borderLeftColor: theme.palette.primary.lowContrast,
				backgroundColor: theme.palette.primary.main,
				padding: theme.spacing(8),
				background: `linear-gradient(325deg, ${theme.palette.tertiary.main} 20%, ${theme.palette.primary.main} 45%)`,
			}}
		>
			<Stack
				direction="row"
				gap={theme.spacing(6)}
			>
				<IconBox>{icon}</IconBox>
				<Typography component="h2">{header}</Typography>
			</Stack>
			{children}
		</Stack>
	);
};

LegendBox.propTypes = {
	children: PropTypes.node,
	icon: PropTypes.node,
	header: PropTypes.string,
};

export default LegendBox;

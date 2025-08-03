import IconButton from "@mui/material/IconButton";
import ArrowRight from "../../ArrowRight";
import ArrowLeft from "../../ArrowLeft";
import { useTheme } from "@mui/material/styles";
import { useDispatch } from "react-redux";
import { toggleSidebar } from "../../../Features/UI/uiSlice";
import PropTypes from "prop-types";

const CollapseButton = ({ collapsed }) => {
	const theme = useTheme();
	const dispatch = useDispatch();
	const arrowIcon = collapsed ? (
		<ArrowRight
			height={theme.spacing(8)}
			width={theme.spacing(8)}
			color={theme.palette.primary.contrastTextSecondary}
		/>
	) : (
		<ArrowLeft
			height={theme.spacing(8)}
			width={theme.spacing(8)}
			color={theme.palette.primary.contrastTextSecondary}
		/>
	);
	return (
		<IconButton
			sx={{
				position: "absolute",
				/* TODO 60 is a magic number. if logo chnges size this might break */
				top: 60,
				right: 0,
				transform: `translate(50%, 0)`,
				backgroundColor: theme.palette.tertiary.main,
				border: `1px solid ${theme.palette.primary.lowContrast}`,
				p: theme.spacing(2.5),

				"&:focus": { outline: "none" },
				"&:hover": {
					backgroundColor: theme.palette.primary.lowContrast,
					borderColor: theme.palette.primary.lowContrast,
				},
			}}
			onClick={() => {
				dispatch(toggleSidebar());
			}}
		>
			{arrowIcon}
		</IconButton>
	);
};

CollapseButton.propTypes = {
	collapsed: PropTypes.bool.isRequired,
};
export default CollapseButton;

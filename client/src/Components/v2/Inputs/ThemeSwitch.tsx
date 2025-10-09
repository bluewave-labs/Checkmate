import { useTheme } from "@mui/material/styles";
import { useDispatch, useSelector } from "react-redux";
import { setMode } from "@/Features/UI/uiSlice.js";
import { useTranslation } from "react-i18next";
import IconButton from "@mui/material/IconButton";

const SunAndMoonIcon = () => {
	const theme = useTheme();

	return (
		<svg
			className="sun-and-moon"
			aria-hidden="true"
			width="24"
			height="24"
			viewBox="0 0 24 24"
		>
			<mask
				className="moon"
				id="moon-mask"
			>
				<rect
					x="0"
					y="0"
					width="100%"
					height="100%"
					fill="#fff"
				/>
				<circle
					cx="24"
					cy="10"
					r="6"
					fill="#000"
				/>
			</mask>
			<circle
				className="sun"
				cx="12"
				cy="12"
				r="6"
				fill={theme.palette.primary.contrastTextSecondary}
				mask="url(#moon-mask)"
			/>
			<g
				className="sun-beams"
				stroke={theme.palette.primary.contrastTextSecondary}
			>
				<line
					x1="12"
					y1="1"
					x2="12"
					y2="3"
				/>
				<line
					x1="12"
					y1="21"
					x2="12"
					y2="23"
				/>
				<line
					x1="4.22"
					y1="4.22"
					x2="5.64"
					y2="5.64"
				/>
				<line
					x1="18.36"
					y1="18.36"
					x2="19.78"
					y2="19.78"
				/>
				<line
					x1="1"
					y1="12"
					x2="3"
					y2="12"
				/>
				<line
					x1="21"
					y1="12"
					x2="23"
					y2="12"
				/>
				<line
					x1="4.22"
					y1="19.78"
					x2="5.64"
					y2="18.36"
				/>
				<line
					x1="18.36"
					y1="5.64"
					x2="19.78"
					y2="4.22"
				/>
			</g>
		</svg>
	);
};

export const ThemeSwitch = ({
	width = 48,
	height = 48,
}: {
	width?: number;
	height?: number;
}) => {
	const mode = useSelector((state: any) => state.ui.mode);
	const dispatch = useDispatch();
	const { t } = useTranslation();

	const handleChange = () => {
		dispatch(setMode(mode === "light" ? "dark" : "light"));
	};

	return (
		<IconButton
			id="theme-toggle"
			title={t("common.buttons.toggleTheme")}
			className={`theme-${mode}`}
			aria-label="auto"
			aria-live="polite"
			onClick={handleChange}
			sx={{
				width,
				height,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
			}}
		>
			<SunAndMoonIcon />
		</IconButton>
	);
};

import { Stack, Typography } from "@mui/material";
import PropTypes from "prop-types";
import { useTheme } from "@emotion/react";

const DEFAULT_GAP = 6;
const FieldWrapper = ({
	label,
	children,
	gap,
	labelMb,
	labelFontWeight = 500,
	labelVariant = "h3",
	labelSx = {},
	sx = {},
}) => {
	const theme = useTheme();
	return (
		<Stack
			gap={gap ?? theme.spacing(DEFAULT_GAP)}
			sx={sx}
		>
			{label && (
				<Typography
					component={labelVariant}
					color={theme.palette.primary.contrastTextSecondary}
					fontWeight={labelFontWeight}
					sx={{
						...(labelMb !== undefined && { mb: theme.spacing(labelMb) }),
						...labelSx,
					}}
				>
					{label}
				</Typography>
			)}
			{children}
		</Stack>
	);
};

FieldWrapper.propTypes = {
	label: PropTypes.node,
	children: PropTypes.node.isRequired,
	gap: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.object]),
	labelMb: PropTypes.number,
	labelFontWeight: PropTypes.number,
	labelVariant: PropTypes.string,
	labelSx: PropTypes.object,
	sx: PropTypes.object,
};

export default FieldWrapper;

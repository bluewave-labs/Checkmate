import { Stack, Skeleton } from "@mui/material";
import { useTheme } from "@emotion/react";
import PropTypes from "prop-types";
const SkeletonLayout = ({ numBoxes, flexWrap }) => {
	const theme = useTheme();
	return (
		<Stack
			direction="row"
			flexWrap={flexWrap}
			gap={theme.spacing(4)}
			mt={theme.spacing(4)}
		>
			{Array.from({ length: numBoxes }).map((_, index) => {
				const width = `${200 / numBoxes}%`;
				return (
					<Skeleton
						variant="rounded"
						width={width}
						height={100}
						key={index}
					/>
				);
			})}
		</Stack>
	);
};

SkeletonLayout.propTypes = {
	flexWrap: PropTypes.string,
	numBoxes: PropTypes.number,
};

export default SkeletonLayout;

import { Box, Skeleton } from "@mui/material";

const SkeletonLayout = () => {
	return (
		<Box
			height={"100%"}
			width={"100%"}
		>
			<Skeleton
				height={"100%"}
				width={"100%"}
			/>
		</Box>
	);
};

export default SkeletonLayout;

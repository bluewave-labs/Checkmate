import { Stack, Skeleton } from "@mui/material";

export const SkeletonLayout = () => {
	return (
		<Stack>
			<Skeleton
				variant="rectangular"
				height={"90vh"}
			/>
		</Stack>
	);
};

export default SkeletonLayout;

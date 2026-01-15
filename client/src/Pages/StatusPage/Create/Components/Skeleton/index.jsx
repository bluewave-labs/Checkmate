import { Stack, Skeleton } from "@mui/material";

const SkeletonLayout = () => {
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

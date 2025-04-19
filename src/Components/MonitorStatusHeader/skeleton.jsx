import { Stack, Skeleton } from "@mui/material";

const SkeletonLayout = () => {
	return (
		<Stack
			direction="row"
			justifyContent="space-between"
		>
			<Skeleton
				height={40}
				variant="rounded"
				width="15%"
			/>
			<Skeleton
				height={40}
				variant="rounded"
				width="15%"
			/>
		</Stack>
	);
};

export default SkeletonLayout;

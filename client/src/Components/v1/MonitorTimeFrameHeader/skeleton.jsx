import { Stack, Skeleton } from "@mui/material";

const SkeletonLayout = () => {
	return (
		<Stack
			direction="row"
			justifyContent="space-between"
		>
			<Skeleton
				variant="rounded"
				width="20%"
				height={34}
			/>
			<Skeleton
				variant="rounded"
				width="20%"
				height={34}
			/>
		</Stack>
	);
};

export default SkeletonLayout;

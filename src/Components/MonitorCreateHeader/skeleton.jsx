import { Stack, Skeleton } from "@mui/material";

const SkeletonLayout = () => {
	return (
		<Stack
			direction="row"
			justifyContent="end"
			alignItems="center"
		>
			<Skeleton
				variant="rectangular"
				width={100}
				height={36}
			/>
		</Stack>
	);
};

export default SkeletonLayout;

import { Skeleton, Stack } from "@mui/material";
import { useTheme } from "@emotion/react";

/**
 * Renders a skeleton layout.
 *
 * @returns {JSX.Element}
 */
const SkeletonLayout = () => {
	const theme = useTheme();

	return (
		<>
			<Stack
				direction="row"
				justifyContent="space-between"
				alignItems="center"
			>
				<Skeleton
					variant="rounded"
					width="50%"
					height={36}
				/>
				<Skeleton
					variant="rounded"
					width="15%"
					height={36}
				/>
			</Stack>
			<Stack
				gap={theme.spacing(12)}
				direction="row"
				justifyContent="space-between"
			>
				<Skeleton
					variant="rounded"
					width="100%"
					height={100}
				/>
				<Skeleton
					variant="rounded"
					width="100%"
					height={100}
				/>
				<Skeleton
					variant="rounded"
					width="100%"
					height={100}
				/>
			</Stack>
			<Skeleton
				variant="rounded"
				width="100%"
				height="100%"
				flex={1}
			/>
		</>
	);
};

export default SkeletonLayout;

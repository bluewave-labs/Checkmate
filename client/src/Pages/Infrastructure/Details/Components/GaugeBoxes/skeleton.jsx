import { Stack, Skeleton } from "@mui/material";
import { useTheme } from "@emotion/react";

const SkeletonLayout = () => {
	const theme = useTheme();

	return (
		<Stack
			direction="row"
			gap={theme.spacing(8)}
		>
			{Array.from({ length: 3 }).map((_, idx) => {
				return (
					<Skeleton
						key={`gauge-${idx}`}
						variant="rectangular"
						width={200}
						height={200}
					/>
				);
			})}
		</Stack>
	);
};

export default SkeletonLayout;

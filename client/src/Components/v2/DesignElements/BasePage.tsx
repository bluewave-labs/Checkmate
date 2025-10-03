import Stack from "@mui/material/Stack";
import type { StackProps } from "@mui/material/Stack";
import { useTheme } from "@mui/material/styles";

interface BasePageProps extends StackProps {
	children: React.ReactNode;
}

export const BasePage: React.FC<BasePageProps> = ({
	children,
	...props
}: {
	children: React.ReactNode;
}) => {
	const theme = useTheme();
	return (
		<Stack
			spacing={theme.spacing(10)}
			{...props}
		>
			{children}
		</Stack>
	);
};

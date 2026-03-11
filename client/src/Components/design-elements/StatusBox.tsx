import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { BaseBox } from "@/Components/design-elements";
import { useTranslation } from "react-i18next";
import type { SxProps } from "@mui/material";

import { useTheme } from "@mui/material/styles";

type StatusBoxProps = React.PropsWithChildren<{
	children: React.ReactNode;
	sx?: SxProps;
}>;

export const BGBox = ({ children, sx }: StatusBoxProps) => {
	const theme = useTheme();
	return (
		<BaseBox
			sx={{
				backgroundColor: theme.palette.background.default,
				overflow: "hidden",
				position: "relative",
				flex: 1,
				padding: theme.spacing(4),
				...sx,
			}}
		>
			<Box
				position="absolute"
				top={0}
				left={0}
				right={0}
				bottom={0}
				sx={{
					pointerEvents: "none",
					backgroundImage: `
						linear-gradient(${theme.palette.divider} 1px, transparent 1px),
						linear-gradient(90deg, ${theme.palette.divider} 1px, transparent 1px)
					`,
					backgroundSize: "24px 24px",
					maskImage:
						"linear-gradient(135deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.4) 100%)",
					WebkitMaskImage:
						"linear-gradient(135deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.4) 100%)",
				}}
			/>
			{children}
		</BaseBox>
	);
};

const StatusBox = ({
	label,
	n,
	color,
	sx,
}: {
	label: string;
	n: number;
	color: string | undefined;
	sx?: SxProps;
}) => {
	const theme = useTheme();
	return (
		<BGBox sx={sx}>
			<Stack spacing={theme.spacing(4)}>
				<Typography
					variant={"h2"}
					textTransform="uppercase"
					color={theme.palette.text.secondary}
				>
					{label}
				</Typography>
				<Typography
					variant="h1"
					color={color}
				>
					{n}
				</Typography>
			</Stack>
		</BGBox>
	);
};

export const UpStatusBox = ({ n }: { n: number }) => {
	const theme = useTheme();
	const { t } = useTranslation();
	return (
		<StatusBox
			label={t("pages.common.monitors.status.up")}
			n={n}
			color={theme.palette.success.light}
		/>
	);
};

export const DownStatusBox = ({ n }: { n: number }) => {
	const theme = useTheme();
	const { t } = useTranslation();
	return (
		<StatusBox
			label={t("pages.common.monitors.status.down")}
			n={n}
			color={theme.palette.error.light}
		/>
	);
};

export const PausedStatusBox = ({ n }: { n: number }) => {
	const theme = useTheme();
	const { t } = useTranslation();
	return (
		<StatusBox
			label={t("pages.common.monitors.status.paused")}
			n={n}
			color={theme.palette.warning.light}
		/>
	);
};
export const MaintenanceStatusBox = ({ n }: { n: number }) => {
	const theme = useTheme();
	const { t } = useTranslation();
	return (
		<StatusBox
			label={t("pages.common.monitors.status.maintenance")}
			n={n}
			color={theme.palette.warning.light}
		/>
	);
};
export const InitializingStatusBox = ({ n }: { n: number }) => {
	const theme = useTheme();
	const { t } = useTranslation();
	return (
		<StatusBox
			label={t("pages.common.monitors.status.initializing")}
			n={n}
			color={theme.palette.warning.light}
		/>
	);
};
export const ExceededStatusBox = ({ n }: { n: number }) => {
	const theme = useTheme();
	const { t } = useTranslation();
	return (
		<StatusBox
			label={t("pages.common.monitors.status.exceeded")}
			n={n}
			color={theme.palette.warning.main}
		/>
	);
};

export const TotalChecksBox = ({ n }: { n: number }) => {
	const theme = useTheme();
	const { t } = useTranslation();
	return (
		<StatusBox
			label={t("pages.common.monitors.status.total")}
			n={n}
			color={theme.palette.primary.light}
		/>
	);
};
export const DownChecksBox = ({ n }: { n: number }) => {
	const theme = useTheme();
	const { t } = useTranslation();
	return (
		<StatusBox
			label={t("pages.common.monitors.status.down")}
			n={n}
			color={theme.palette.error.light}
		/>
	);
};
export const UpChecksBox = ({ n }: { n: number }) => {
	const theme = useTheme();
	const { t } = useTranslation();
	return (
		<StatusBox
			label={t("pages.common.monitors.status.up")}
			n={n}
			color={theme.palette.success.light}
		/>
	);
};

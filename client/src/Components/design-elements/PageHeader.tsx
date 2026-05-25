import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import { Link as RouterLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material/styles";
import { ChevronLeft, HelpCircle, FileText, Code } from "lucide-react";

import type { ReactNode } from "react";

const EXTERNAL_LINKS = {
	support: "https://discord.com/invite/NAb6H3UTjK",
	docs: "https://checkmate.so/docs",
	changelog: "https://github.com/bluewave-labs/checkmate/releases",
};

interface PageHeaderProps {
	title: string;
	description?: ReactNode;
	backTo?: string;
	backLabel?: string;
}

export const PageHeader = ({
	title,
	description,
	backTo,
	backLabel,
}: PageHeaderProps) => {
	const theme = useTheme();
	const { t } = useTranslation();

	const linkItems: { key: keyof typeof EXTERNAL_LINKS; icon: ReactNode }[] = [
		{
			key: "support",
			icon: (
				<HelpCircle
					size={16}
					strokeWidth={1.6}
				/>
			),
		},
		{
			key: "docs",
			icon: (
				<FileText
					size={16}
					strokeWidth={1.6}
				/>
			),
		},
		{
			key: "changelog",
			icon: (
				<Code
					size={16}
					strokeWidth={1.6}
				/>
			),
		},
	];

	return (
		<Stack
			direction="row"
			alignItems="flex-start"
			justifyContent="space-between"
			gap={6}
			sx={{ mb: theme.spacing(8) }}
		>
			<Stack gap={theme.spacing(1)}>
				{backTo && backLabel && (
					<Box
						component={RouterLink}
						to={backTo}
						sx={{
							display: "inline-flex",
							alignItems: "center",
							gap: 0.5,
							textDecoration: "none",
							color: theme.palette.text.secondary,
							fontSize: 13,
							mb: theme.spacing(1),
							"&:hover": { color: theme.palette.text.primary },
						}}
					>
						<ChevronLeft
							size={14}
							strokeWidth={1.8}
						/>
						{backLabel}
					</Box>
				)}
				<Typography
					sx={{
						fontSize: 26,
						fontWeight: 400,
						color: theme.palette.text.primary,
						lineHeight: 1.15,
						letterSpacing: "-0.02em",
					}}
				>
					{title}
				</Typography>
				{description && (
					<Typography
						sx={{
							fontSize: 14,
							color: theme.palette.text.secondary,
							lineHeight: 1.55,
							maxWidth: 640,
						}}
					>
						{description}
					</Typography>
				)}
			</Stack>
			<Box
				sx={{
					display: "inline-flex",
					alignItems: "center",
					border: `1px solid ${theme.palette.divider}`,
					borderRadius: 1,
					overflow: "hidden",
					backgroundColor: theme.palette.background.paper,
					flexShrink: 0,
				}}
			>
				{linkItems.map((item, idx) => (
					<Tooltip
						key={item.key}
						title={t(`components.pageHeader.links.${item.key}`)}
					>
						<Box
							component="a"
							href={EXTERNAL_LINKS[item.key]}
							target="_blank"
							rel="noopener noreferrer"
							sx={{
								display: "inline-flex",
								alignItems: "center",
								justifyContent: "center",
								width: 36,
								height: 32,
								color: theme.palette.text.secondary,
								borderRight:
									idx < linkItems.length - 1
										? `1px solid ${theme.palette.divider}`
										: "none",
								"&:hover": {
									backgroundColor: theme.palette.action.hover,
									color: theme.palette.text.primary,
								},
							}}
						>
							{item.icon}
						</Box>
					</Tooltip>
				))}
			</Box>
		</Stack>
	);
};

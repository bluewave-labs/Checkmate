import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import { Link as RouterLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material/styles";
import { ChevronLeft, HelpCircle, FileText, Code } from "lucide-react";
import {
	FONT_WEIGHT,
	HEADER_LINK_WIDTH,
	ICON_SIZE,
	ICON_STROKE,
	INPUT_BASE_HEIGHT,
	LINE_HEIGHT,
	RADIUS,
} from "@/Utils/Theme/constants";
import { typographyLevels } from "@/Utils/Theme/Palette";
import { useAppVersion } from "@/Hooks/useAppVersion";
import { PulseDot } from "@/Components/design-elements/PulseDot";
import { formatVersion } from "@/Utils/FormatUtils";

import type { ReactNode } from "react";

const EXTERNAL_LINKS = {
	support: "https://discord.com/invite/NAb6H3UTjK",
	docs: "https://checkmate.so/docs",
	changelog: "https://checkmate.so/changelog",
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
	const { versionInfo } = useAppVersion();
	const showUpdate = Boolean(versionInfo?.updateAvailable && versionInfo.latest);
	const latestLabel = versionInfo?.latest && formatVersion(versionInfo.latest);

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
							fontSize: typographyLevels.base,
							mb: theme.spacing(1),
							"&:hover": { color: theme.palette.text.primary },
						}}
					>
						<ChevronLeft
							size={ICON_SIZE.SM}
							strokeWidth={ICON_STROKE}
						/>
						{backLabel}
					</Box>
				)}
				<Typography
					component="h1"
					fontSize={typographyLevels.title}
					fontWeight={FONT_WEIGHT.MEDIUM}
					color={theme.palette.text.primary}
					lineHeight={LINE_HEIGHT.HEADING}
					letterSpacing="-0.02em"
				>
					{title}
				</Typography>
				{description && (
					<Typography
						fontSize={typographyLevels.base}
						color={theme.palette.text.secondary}
						lineHeight={LINE_HEIGHT.BODY}
						maxWidth="108ch"
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
					borderRadius: RADIUS.SM,
					overflow: "hidden",
					backgroundColor: theme.palette.background.paper,
					flexShrink: 0,
				}}
			>
				{showUpdate && (
					<Tooltip title={t("components.pageHeader.update.tooltip")}>
						<Box
							component="a"
							href={EXTERNAL_LINKS.changelog}
							target="_blank"
							rel="noopener noreferrer"
							display="inline-flex"
							alignItems="center"
							height={INPUT_BASE_HEIGHT}
							gap={theme.spacing(1)}
							pl={theme.spacing(3)}
							pr={theme.spacing(5)}
							borderRight={`1px solid ${theme.palette.divider}`}
							color={theme.palette.text.primary}
							fontSize={typographyLevels.base}
							sx={{
								textDecoration: "none",
								whiteSpace: "nowrap",
								"&:hover": {
									backgroundColor: theme.palette.action.hover,
								},
							}}
						>
							<PulseDot
								color={theme.palette.success.main}
								size={9}
							/>
							{t("components.pageHeader.update.available", {
								version: latestLabel,
							})}
						</Box>
					</Tooltip>
				)}
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
								width: HEADER_LINK_WIDTH,
								height: INPUT_BASE_HEIGHT,
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

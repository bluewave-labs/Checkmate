import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { Tooltip } from "./Tooltip";
import { Link as RouterLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material/styles";
import { ChevronLeft, HelpCircle, FileText, Code } from "lucide-react";
import { INPUT_BASE_HEIGHT, LAYOUT, SPACING } from "@/Utils/Theme/constants";
import { typographyLevels } from "@/Utils/Theme/Palette";
import { useAppVersion } from "@/Hooks/useAppVersion";
import { PulseDot } from "@/Components/design-elements/PulseDot";
import { formatVersion } from "@/Utils/FormatUtils";

import type { ReactNode } from "react";

const HEADER_LINK_WIDTH = 32;

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
			gap={LAYOUT.SM}
			mb={theme.spacing(8)}
		>
			<Stack gap={theme.spacing(SPACING.SM)}>
				{backTo && backLabel && (
					<Box
						component={RouterLink}
						to={backTo}
						display="inline-flex"
						gap={SPACING.XS}
						color={theme.palette.text.secondary}
						fontSize={typographyLevels.base}
						mb={theme.spacing(1)}
						alignItems={"center"}
						sx={{
							textDecoration: "none",
							"&:hover": { color: theme.palette.text.primary },
						}}
					>
						<ChevronLeft
							size={14}
							strokeWidth={1.5}
						/>
						{backLabel}
					</Box>
				)}
				<Typography
					component="h1"
					fontSize={typographyLevels.xxl}
					fontWeight={500}
					color={theme.palette.text.primary}
					lineHeight={1.3}
					letterSpacing="-0.02em"
				>
					{title}
				</Typography>
				{description && (
					<Typography
						fontSize={typographyLevels.base}
						color={theme.palette.text.secondary}
						lineHeight={1.5}
						maxWidth="108ch"
					>
						{description}
					</Typography>
				)}
			</Stack>
			<Box
				display="inline-flex"
				border={`1px solid ${theme.palette.divider}`}
				borderRadius={theme.shape.borderRadius}
				bgcolor={theme.palette.background.paper}
				alignItems={"center"}
				overflow={"hidden"}
				flexShrink={0}
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
							gap={theme.spacing(SPACING.SM)}
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
							alignItems={"center"}
							justifyContent="center"
							display="inline-flex"
							width={HEADER_LINK_WIDTH}
							height={INPUT_BASE_HEIGHT}
							color={theme.palette.text.secondary}
							borderRight={
								idx < linkItems.length - 1 ? `1px solid ${theme.palette.divider}` : "none"
							}
							sx={{
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

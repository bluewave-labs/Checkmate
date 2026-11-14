import { useState, type KeyboardEvent } from "react";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { alpha, keyframes, useTheme } from "@mui/material/styles";
import { ArrowRight, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button } from "@/Components/inputs";
import Icon from "@/Components/design-elements/Icon";
import { useIsSuperAdmin } from "@/Hooks/useIsAdmin";
import { useSceneClock } from "@/Components/whats-new/scenes/sceneTheme";
import {
	WhatsNewSteps,
	whatsNewStepConfig,
	type WhatsNewStep,
} from "@/Components/whats-new/steps";
import { LAYOUT } from "@/Utils/Theme/constants";
import { typographyLevels } from "@/Utils/Theme/Palette";
import { formatVersion } from "@/Utils/FormatUtils";

// transitions.dev motion: page slide 250ms / 8px / 3px blur, texts reveal 500ms / 12px / 40ms stagger
const EASE_SMOOTH_OUT = "cubic-bezier(0.22, 1, 0.36, 1)";
const slideFrom = (distance: number) => keyframes`
	from { opacity: 0; transform: translateX(${distance}px); filter: blur(3px); }
	to { opacity: 1; transform: none; filter: none; }
`;
const slideFromRight = slideFrom(8);
const slideFromLeft = slideFrom(-8);
const reveal = keyframes`
	from { opacity: 0; transform: translateY(12px); filter: blur(3px); }
	to { opacity: 1; transform: none; filter: none; }
`;
const fadeIn = keyframes`
	from { opacity: 0; }
	to { opacity: 1; }
`;
const STAGGER_MS = 40;
const SETTINGS_CONNECT_PATH = "/settings?tab=connect";
const DOT_SIZE = 8;
const DOT_ACTIVE_WIDTH = 20;
const MODAL_MAX_WIDTH = 680;
const HERO_ASPECT = "640 / 300";

const revealLine = (index: number) => ({
	animation: `${reveal} 500ms ${EASE_SMOOTH_OUT} ${index * STAGGER_MS}ms both`,
	"@media (prefers-reduced-motion: reduce)": { animation: "none" },
});

const StepScene = ({
	step,
	reducedMotion,
}: {
	step: WhatsNewStep;
	reducedMotion: boolean;
}) => {
	const { Scene, duration } = whatsNewStepConfig[step];
	const time = useSceneClock(duration, reducedMotion);
	return <Scene time={time} />;
};

interface StepCopyProps {
	step: WhatsNewStep;
	index: number;
	animate: boolean;
	isSuperAdmin: boolean;
	onSetUp: () => void;
}

const StepCopy = ({ step, index, animate, isSuperAdmin, onSetUp }: StepCopyProps) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const { connect } = whatsNewStepConfig[step];
	const line = (i: number) => (animate ? revealLine(i) : undefined);
	// The copy names these controls, so it uses the same translated labels the app shows
	const labels = {
		arrange: t("pages.dashboard.arrange.start"),
		editCards: t("pages.dashboard.editCards"),
		settings: t("components.sidebar.menu.settings"),
	};

	return (
		<Stack gap={theme.spacing(LAYOUT.XS)}>
			<Stack
				direction="row"
				justifyContent="space-between"
				alignItems="center"
				sx={line(0)}
			>
				<Typography
					fontSize={typographyLevels.s}
					fontWeight={500}
					color={theme.palette.primary.main}
				>
					{t("components.whatsNew.eyebrow", { version: formatVersion(__APP_VERSION__) })}
				</Typography>
				<Typography
					fontSize={typographyLevels.s}
					color={theme.palette.text.secondary}
				>
					{t("components.whatsNew.stepCount", {
						current: index + 1,
						total: WhatsNewSteps.length,
					})}
				</Typography>
			</Stack>
			<Stack
				direction="row"
				alignItems="center"
				flexWrap="wrap"
				columnGap={theme.spacing(LAYOUT.MD)}
				rowGap={theme.spacing(LAYOUT.XXS)}
				sx={line(1)}
			>
				<Typography
					component="h2"
					id={animate ? "whats-new-title" : undefined}
					fontSize={typographyLevels.xl}
					fontWeight={500}
					color={theme.palette.text.primary}
				>
					{t(`components.whatsNew.steps.${step}.title`)}
				</Typography>
				{connect && (
					<Typography
						fontSize={typographyLevels.s}
						fontWeight={500}
						color={theme.palette.primary.main}
						bgcolor={alpha(theme.palette.primary.main, 0.08)}
						border={`1px solid ${alpha(theme.palette.primary.main, 0.2)}`}
						borderRadius={`${theme.shape.borderRadius}px`}
						px={theme.spacing(LAYOUT.XS)}
						lineHeight={1.7}
					>
						{t("components.whatsNew.connectTag")}
					</Typography>
				)}
			</Stack>
			<Typography
				color={theme.palette.text.secondary}
				lineHeight={1.55}
				sx={line(2)}
			>
				{t(`components.whatsNew.steps.${step}.description`, labels)}
			</Typography>
			{connect && (
				<Stack
					direction={{ xs: "column", sm: "row" }}
					alignItems={{ xs: "flex-start", sm: "center" }}
					justifyContent="space-between"
					gap={theme.spacing(LAYOUT.SM)}
					mt={theme.spacing(LAYOUT.SM)}
					p={theme.spacing(LAYOUT.SM)}
					pl={theme.spacing(LAYOUT.MD)}
					bgcolor={theme.palette.background.default}
					border={`1px solid ${theme.palette.divider}`}
					borderRadius={`${theme.shape.borderRadius}px`}
					sx={line(2)}
				>
					<Typography
						fontSize={typographyLevels.s}
						color={theme.palette.text.secondary}
					>
						{t(
							isSuperAdmin
								? "components.whatsNew.connectHint"
								: "components.whatsNew.connectAskSuperadmin",
							labels
						)}
					</Typography>
					{isSuperAdmin && (
						<Button
							variant="outlined"
							onClick={onSetUp}
							endIcon={
								<Icon
									icon={ArrowRight}
									size={14}
								/>
							}
						>
							{t("components.whatsNew.connectCta")}
						</Button>
					)}
				</Stack>
			)}
		</Stack>
	);
};

interface WhatsNewDialogProps {
	open: boolean;
	onClose: () => void;
}

export const WhatsNewDialog = ({ open, onClose }: WhatsNewDialogProps) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const navigate = useNavigate();
	const isSuperAdmin = useIsSuperAdmin();
	const isSmall = useMediaQuery(theme.breakpoints.down("sm"));
	const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
	const [index, setIndex] = useState(0);
	const [direction, setDirection] = useState(1);
	const step = WhatsNewSteps[index];
	const isFirst = index === 0;
	const isLast = index === WhatsNewSteps.length - 1;

	const goTo = (next: number) => {
		if (next < 0 || next >= WhatsNewSteps.length || next === index) return;
		setDirection(next > index ? 1 : -1);
		setIndex(next);
	};

	const handleKeyDown = (event: KeyboardEvent) => {
		if (event.key === "ArrowRight") goTo(index + 1);
		if (event.key === "ArrowLeft") goTo(index - 1);
	};

	const handleSetUp = () => {
		onClose();
		navigate(SETTINGS_CONNECT_PATH);
	};

	return (
		<Dialog
			open={open}
			onClose={onClose}
			onKeyDown={handleKeyDown}
			maxWidth={false}
			aria-labelledby="whats-new-title"
			slotProps={{
				paper: {
					sx: {
						width: `min(${MODAL_MAX_WIDTH}px, calc(100% - ${theme.spacing(LAYOUT.XXL)}))`,
						m: theme.spacing(LAYOUT.MD),
						borderRadius: `${theme.shape.borderRadius}px`,
						backgroundImage: "none",
						overflow: "hidden",
					},
				},
			}}
		>
			<IconButton
				aria-label={t("common.buttons.close")}
				onClick={onClose}
				size="small"
				sx={{
					// Over the illustration on wider screens; in the flow above the copy when it's hidden
					position: isSmall ? "static" : "absolute",
					alignSelf: "flex-end",
					mt: isSmall ? theme.spacing(LAYOUT.XS) : 0,
					mr: isSmall ? theme.spacing(LAYOUT.XS) : 0,
					top: theme.spacing(LAYOUT.LG),
					right: theme.spacing(LAYOUT.LG),
					zIndex: 1,
					bgcolor: alpha(theme.palette.background.paper, 0.85),
					borderRadius: `${theme.shape.borderRadius}px`,
					"&:hover": { bgcolor: theme.palette.background.paper },
				}}
			>
				<Icon
					icon={X}
					size={16}
				/>
			</IconButton>
			{!isSmall && (
				<Box
					position="relative"
					bgcolor={theme.palette.background.default}
					borderBottom={`1px solid ${theme.palette.divider}`}
					sx={{ aspectRatio: HERO_ASPECT }}
				>
					<Box
						key={step}
						position="absolute"
						top={0}
						right={0}
						bottom={0}
						left={0}
						sx={{
							animation: `${fadeIn} 150ms ease both`,
							"@media (prefers-reduced-motion: reduce)": { animation: "none" },
						}}
					>
						<StepScene
							step={step}
							reducedMotion={reducedMotion}
						/>
					</Box>
				</Box>
			)}
			{/* Every step is laid out invisibly in the same grid cell, so the copy area is always as
			    tall as the longest step: no jump between steps, and room for longer translations */}
			<Box
				display="grid"
				px={theme.spacing(isSmall ? LAYOUT.MD : LAYOUT.XL)}
				pt={isSmall ? 0 : theme.spacing(LAYOUT.MD)}
				pb={theme.spacing(LAYOUT.LG)}
			>
				{WhatsNewSteps.map((sizer, i) => (
					<Box
						key={sizer}
						gridArea="1 / 1"
						minWidth={0}
						visibility="hidden"
						aria-hidden="true"
					>
						<StepCopy
							step={sizer}
							index={i}
							animate={false}
							isSuperAdmin={isSuperAdmin}
							onSetUp={handleSetUp}
						/>
					</Box>
				))}
				<Box
					key={step}
					gridArea="1 / 1"
					minWidth={0}
					sx={{
						animation: `${direction > 0 ? slideFromRight : slideFromLeft} 250ms ${EASE_SMOOTH_OUT} both`,
						"@media (prefers-reduced-motion: reduce)": { animation: "none" },
					}}
				>
					<StepCopy
						step={step}
						index={index}
						animate
						isSuperAdmin={isSuperAdmin}
						onSetUp={handleSetUp}
					/>
				</Box>
			</Box>
			<Stack
				direction="row"
				alignItems="center"
				justifyContent="space-between"
				flexWrap="wrap"
				gap={theme.spacing(LAYOUT.MD)}
				px={theme.spacing(isSmall ? LAYOUT.MD : LAYOUT.XL)}
				py={theme.spacing(LAYOUT.SM)}
				borderTop={`1px solid ${theme.palette.divider}`}
			>
				<Stack
					direction="row"
					alignItems="center"
					gap={theme.spacing(LAYOUT.XS)}
				>
					{WhatsNewSteps.map((dot, i) => (
						<Box
							key={dot}
							component="button"
							type="button"
							aria-label={t("components.whatsNew.goToStep", { step: i + 1 })}
							aria-current={i === index ? "step" : undefined}
							onClick={() => goTo(i)}
							width={i === index ? DOT_ACTIVE_WIDTH : DOT_SIZE}
							height={DOT_SIZE}
							p={0}
							border={0}
							borderRadius={`${DOT_SIZE / 2}px`}
							bgcolor={i === index ? theme.palette.primary.main : theme.palette.divider}
							sx={{
								cursor: "pointer",
								transition: `width 250ms ${EASE_SMOOTH_OUT}, background-color 250ms ease`,
							}}
						/>
					))}
				</Stack>
				<Stack
					direction="row"
					alignItems="center"
					gap={theme.spacing(LAYOUT.XS)}
				>
					{!isLast && (
						<Button
							variant="text"
							onClick={onClose}
							sx={{ color: theme.palette.text.secondary }}
						>
							{t("components.whatsNew.skip")}
						</Button>
					)}
					{!isFirst && (
						<Button
							variant="outlined"
							onClick={() => goTo(index - 1)}
						>
							{t("common.buttons.back")}
						</Button>
					)}
					<Button
						variant="contained"
						onClick={isLast ? onClose : () => goTo(index + 1)}
					>
						{isLast ? t("components.whatsNew.done") : t("common.buttons.next")}
					</Button>
				</Stack>
			</Stack>
		</Dialog>
	);
};

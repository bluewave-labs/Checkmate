import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import FormControlLabel from "@mui/material/FormControlLabel";
import { useTheme } from "@mui/material/styles";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Button, Checkbox } from "@/Components/inputs";
import { setDashboardCardsVisibility, resetDashboardCards } from "@/Features/UI/uiSlice";
import {
	cardCategories,
	defaultVisibleCards,
	DASHBOARD_CARD_IDS,
} from "@/Pages/Dashboard/dashboardCards";
import type { DashboardCardId } from "@/Pages/Dashboard/dashboardCards";
import type { RootState } from "@/Types/state";
import { LAYOUT } from "@/Utils/Theme/constants";
import { typographyLevels } from "@/Utils/Theme/Palette";

interface EditCardsModalProps {
	open: boolean;
	onClose: () => void;
}

const leftCategories = cardCategories.slice(0, Math.ceil(cardCategories.length / 2));
const rightCategories = cardCategories.slice(Math.ceil(cardCategories.length / 2));

export const EditCardsModal = ({ open, onClose }: EditCardsModalProps) => {
	const theme = useTheme();
	const dispatch = useDispatch();
	const { t } = useTranslation();

	const visibility = useSelector(
		(state: RootState) => state.ui.dashboardCards ?? defaultVisibleCards
	);

	const allVisible = DASHBOARD_CARD_IDS.every((id) => visibility[id]);
	const someVisible = DASHBOARD_CARD_IDS.some((id) => visibility[id]);
	const selectAllIndeterminate = someVisible && !allVisible;

	const handleToggleCard = (id: DashboardCardId, visible: boolean) => {
		dispatch(setDashboardCardsVisibility({ id, visible }));
	};

	const handleSelectAll = () => {
		const next = !allVisible;
		DASHBOARD_CARD_IDS.forEach((id) => {
			dispatch(setDashboardCardsVisibility({ id, visible: next }));
		});
	};

	const handleReset = () => {
		dispatch(resetDashboardCards());
	};

	const renderCategory = (category: (typeof cardCategories)[number]) => (
		<Stack
			key={category.labelKey}
			gap={theme.spacing(LAYOUT.XXS)}
		>
			<Typography
				fontSize={typographyLevels.s}
				fontWeight={600}
				letterSpacing="0.08em"
				color={theme.palette.text.disabled}
				textTransform="uppercase"
				mb={theme.spacing(LAYOUT.XXS)}
			>
				{t(category.labelKey)}
			</Typography>
			{category.cards.map((id) => (
				<FormControlLabel
					key={id}
					label={
						<Typography fontSize={typographyLevels.m}>
							{t(`pages.dashboard.cards.${id}`)}
						</Typography>
					}
					control={
						<Checkbox
							size="small"
							checked={visibility[id] ?? false}
							onChange={(e) => handleToggleCard(id, e.target.checked)}
						/>
					}
					sx={{ m: 0, gap: theme.spacing(LAYOUT.SM) }}
				/>
			))}
		</Stack>
	);

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="sm"
			fullWidth
		>
			<DialogTitle
				pb={theme.spacing(LAYOUT.XS)}
				bgcolor={theme.palette.action.hover}
				borderBottom={`1px solid ${theme.palette.divider}`}
			>
				<Typography
					component="span"
					fontWeight={600}
					fontSize={typographyLevels.l}
					display="block"
				>
					{t("pages.dashboard.modal.title")}
				</Typography>
			</DialogTitle>

			<DialogContent sx={{ pt: theme.spacing(LAYOUT.MD) }}>
				<Box
					display="grid"
					gridTemplateColumns="1fr 1fr"
					gap={theme.spacing(LAYOUT.XL)}
					pt={theme.spacing(LAYOUT.XS)}
				>
					<Stack gap={theme.spacing(LAYOUT.LG)}>
						{leftCategories.map(renderCategory)}
					</Stack>
					<Stack gap={theme.spacing(LAYOUT.LG)}>
						{rightCategories.map(renderCategory)}
					</Stack>
				</Box>
			</DialogContent>

			<DialogActions
				sx={{
					p: theme.spacing(LAYOUT.MD),
					pt: theme.spacing(LAYOUT.SM),
					bgcolor: theme.palette.action.hover,
					borderTop: `1px solid ${theme.palette.divider}`,
					justifyContent: "space-between",
				}}
			>
				<Button
					variant="outlined"
					onClick={handleReset}
				>
					{t("pages.dashboard.modal.resetToDefaults")}
				</Button>

				<Stack
					direction="row"
					alignItems="center"
					gap={theme.spacing(LAYOUT.SM)}
				>
					<FormControlLabel
						label={
							<Typography fontSize={typographyLevels.m}>
								{t("pages.dashboard.modal.selectAll")}
							</Typography>
						}
						control={
							<Checkbox
								size="small"
								checked={allVisible}
								indeterminate={selectAllIndeterminate}
								onChange={handleSelectAll}
							/>
						}
						sx={{ m: 0, gap: theme.spacing(LAYOUT.SM) }}
					/>
					<Button
						variant="contained"
						onClick={onClose}
					>
						{t("pages.dashboard.modal.done")}
					</Button>
				</Stack>
			</DialogActions>
		</Dialog>
	);
};

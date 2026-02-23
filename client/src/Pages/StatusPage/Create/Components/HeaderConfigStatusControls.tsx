import Stack from "@mui/material/Stack";
import { Icon } from "@/Components/design-elements";
import { Button, ColorInput, TextField } from "@/Components/inputs";
import { Trash } from "lucide-react";

import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material/styles";

interface HeaderConfigStatusControlsProps {
	onDelete: () => void;
	control?: any; // optional if you want to pass react-hook-form control
}

export const HeaderConfigStatusControls = ({
	onDelete={handleDeleteClick},
	control={control},
}: React.PropsWithChildren<HeaderConfigStatusControlsProps>) => {
	const theme = useTheme();
	const { t } = useTranslation();
	return (
		<Stack
			spacing={{ xs: theme.spacing(8), md: 0 }}
			direction={{ xs: "column", md: "row" }}
			alignItems={"center"}
			justifyContent={"end"}
		>
			<Button
				variant="contained"
				color="error"
				startIcon={<Icon icon={Trash} />}
				onClick={onDelete}
			>
				{t("common.buttons.delete")}
			</Button>

			{/* Only render the color input if control is provided */}
			{control && (
				<Controller
					name="color"
					control={control}
					render={({ field }) => (
						<ColorInput
							format="hex"
							value={field.value}
							onChange={field.onChange}
							fieldLabel={t("pages.statusPages.config.color")}
						/>
					)}
				/>
			)}

			{control && (
				<Controller
					name="customCSS"
					control={control}
					render={({ field }) => (
						<>
							<TextField
								{...field}
								multiline
								rows={6}
								fullWidth
								fieldLabel={t("pages.statusPages.config.customCSS")}
								placeholder={t("pages.statusPages.config.customCSSPlaceholder")}
							/>
							<div className="preview">
<style>{field.value}</style>  {/* Live preview */}
							</div>
						</>
					)}
				/>
			)}
		</Stack>
	);
};

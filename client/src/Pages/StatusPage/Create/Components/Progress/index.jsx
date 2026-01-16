import { Button, Box } from "@mui/material";
import ProgressUpload from "@/Components/v1/ProgressBars/index.jsx";
import Icon from "@/Components/v1/Icon";
import { useTranslation } from "react-i18next";
import { formatBytes } from "../../../../../Utils/fileUtils.js";
const Progress = ({ isLoading, progressValue, logo, logoType, removeLogo, errors }) => {
	const { t } = useTranslation();
	if (isLoading) {
		return (
			<ProgressUpload
				icon={<Icon name="Image" size={20} />}
				label={logo?.name}
				size={formatBytes(logo?.size)}
				progress={progressValue}
				onClick={removeLogo}
			/>
		);
	}

	if (logo && logoType) {
		return (
			<Box
				width="fit-content"
				alignSelf="center"
			>
				<Button
					variant="contained"
					color="secondary"
					onClick={removeLogo}
				>
					{t("removeLogo")}
				</Button>
			</Box>
		);
	}
};

export default Progress;

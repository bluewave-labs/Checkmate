import { Button, Box } from "@mui/material";
import ProgressUpload from "../../../../../Components/ProgressBars";
import ImageIcon from "@mui/icons-material/Image";

import { formatBytes } from "../../../../../Utils/fileUtils";
const Progress = ({ isLoading, progressValue, logo, logoType, removeLogo, errors }) => {
	if (isLoading) {
		return (
			<ProgressUpload
				icon={<ImageIcon />}
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
					Remove Logo
				</Button>
			</Box>
		);
	}
};

export default Progress;

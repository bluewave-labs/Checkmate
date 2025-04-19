import html2canvas from "html2canvas";
import ShareIcon from "@mui/icons-material/Share";
import { Button } from "@mui/material";
import { useTheme } from "@emotion/react";

const ShareComponent = ({ elementToCapture, fileName = "screenshot" }) => {
	const theme = useTheme();
	const captureAndShare = async () => {
		try {
			// Temporarily apply styles directly to the element
			const originalBackground = elementToCapture.current.style.background;
			const originalPadding = elementToCapture.current.style.padding;

			elementToCapture.current.style.background = `radial-gradient(circle, ${theme.palette.gradient.color1}, ${theme.palette.gradient.color2}, ${theme.palette.gradient.color3}, ${theme.palette.gradient.color4}, ${theme.palette.gradient.color5})`;
			elementToCapture.current.style.padding = `${theme.spacing(20)}`;

			// Capture the element directly
			const canvas = await html2canvas(elementToCapture.current, {
				useCORS: true,
				scale: 2,
				allowTaint: true,
				backgroundColor: null,
			});

			// Restore original styles
			elementToCapture.current.style.background = originalBackground;
			elementToCapture.current.style.padding = originalPadding;

			const imageBlob = await new Promise((resolve) =>
				canvas.toBlob(resolve, "image/png")
			);

			const file = new File([imageBlob], `${fileName}.png`, {
				type: "image/png",
			});

			if (navigator.share) {
				await navigator.share({
					files: [file],
					title: "Screenshot",
					text: "Check out this screenshot!",
				});
			} else {
				const url = URL.createObjectURL(imageBlob);
				const a = document.createElement("a");
				a.href = url;
				a.download = `${fileName}.png`;
				a.click();
				URL.revokeObjectURL(url);
			}
		} catch (error) {
			console.error(error);
		}
	};
	return (
		<Button
			variant="outlined"
			startIcon={<ShareIcon sx={{ color: theme.palette.success.main }} />}
			color="success"
			onClick={captureAndShare}
		>
			Share
		</Button>
	);
};

export default ShareComponent;

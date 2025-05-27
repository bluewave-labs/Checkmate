// Components
import { Stack, Typography } from "@mui/material";
import { ColContainer } from "../../../../../Components/StandardContainer";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import Dot from "../../../../../Components/Dot";
// Utils
import { useTheme } from "@emotion/react";
import { useTranslation } from "react-i18next";

const MESSAGES = [
	"I've checked the network status, and we're seeing excellent performance across all regions.",
	"The network is stable and functioning optimally. All connections are active and stable.",
	"I've reviewed the network status, and everything looks great. No issues detected.",
	"The network is up and running smoothly. All connections are active and stable.",
	"I've checked the network status, and everything is looking good. No issues detected.",
];

const ChatBot = ({ sx }) => {
	const theme = useTheme();
	const { t } = useTranslation();
	return (
		<ColContainer
			backgroundColor={theme.palette.chatbot.background}
			sx={{ ...sx }}
		>
			<Stack
				direction="row"
				alignItems="center"
				gap={theme.spacing(4)}
			>
				<SmartToyIcon sx={{ color: theme.palette.chatbot.textAccent }} />
				<Typography color={theme.palette.chatbot.textAccent}>Status Bot</Typography>
				<Dot
					color={theme.palette.chatbot.textAccent}
					style={{ opacity: 0.4 }}
				/>
				<Typography
					variant="body2"
					color={theme.palette.chatbot.textAccent}
					sx={{ opacity: 0.4 }}
				>
					{t("now")}
				</Typography>
			</Stack>
			<Typography>{MESSAGES[Math.floor(Math.random() * MESSAGES.length)]}</Typography>
		</ColContainer>
	);
};

export default ChatBot;
